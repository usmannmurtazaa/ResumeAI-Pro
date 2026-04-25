import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiAlertCircle,
  FiAward,
  FiBell,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCommand,
  FiCreditCard,
  FiDownload,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiInfo,
  FiLayout,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiStar,
  FiSun,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiX,
  FiZap,
} from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Tooltip from '../components/ui/Tooltip';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useResume } from '../contexts/ResumeContext';
import toast from 'react-hot-toast';

const SIDEBAR_STORAGE_KEY = 'dashboardSidebarCollapsed';
const COMMAND_INPUT_ID = 'dashboard-command-palette-input';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const getStoredSidebarCollapsed = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const savedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return savedValue ? JSON.parse(savedValue) === true : false;
  } catch {
    return false;
  }
};

const getGreeting = () => {
  const currentHour = new Date().getHours();

  if (currentHour < 12) {
    return 'Good morning';
  }

  if (currentHour < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
};

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

const getNotificationMeta = (type) => {
  switch (type) {
    case 'success':
      return {
        icon: FiCheckCircle,
        className:
          'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      };
    case 'warning':
      return {
        icon: FiAlertCircle,
        className:
          'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      };
    case 'error':
      return {
        icon: FiAlertCircle,
        className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      };
    default:
      return {
        icon: FiInfo,
        className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      };
  }
};

const statToneClasses = {
  blue: {
    surface: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    surface: 'bg-green-100 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
  },
  purple: {
    surface: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    surface: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'text-orange-600 dark:text-orange-400',
  },
};

const templates = [
  {
    id: 'modern',
    name: 'Modern',
    icon: '🎨',
    previewClass: 'from-blue-500 to-cyan-500',
    description: 'Clean and contemporary',
  },
  {
    id: 'classic',
    name: 'Classic',
    icon: '📄',
    previewClass: 'from-gray-600 to-gray-800',
    description: 'Traditional format',
  },
  {
    id: 'creative',
    name: 'Creative',
    icon: '✨',
    previewClass: 'from-purple-500 to-pink-500',
    description: 'Stand out design',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    icon: '◻️',
    previewClass: 'from-green-500 to-emerald-500',
    description: 'Simple and elegant',
  },
  {
    id: 'executive',
    name: 'Executive',
    icon: '👔',
    previewClass: 'from-slate-700 to-slate-900',
    description: 'Senior positions',
  },
  {
    id: 'tech',
    name: 'Tech',
    icon: '💻',
    previewClass: 'from-indigo-500 to-blue-600',
    description: 'Tech industry focus',
  },
];

const QuickStat = ({ icon: Icon, label, value, tone = 'blue' }) => {
  const toneClasses = statToneClasses[tone] || statToneClasses.blue;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3 backdrop-blur-sm dark:bg-gray-800/60">
      <div className={cn('rounded-lg p-2', toneClasses.surface)}>
        <Icon className={cn('h-4 w-4', toneClasses.icon)} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

const WelcomeCard = ({ greeting, firstName, stats, resumes, onCreateResume, onContinue }) => {
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
          <h2 className="mb-1 text-2xl font-bold gradient-text">
            {greeting}, {firstName}! 👋
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            {totalResumes > 0
              ? `You have ${totalResumes} resume${totalResumes !== 1 ? 's' : ''} with an average ATS score of ${averageScore}%.`
              : 'Ready to create your first professional, ATS-friendly resume?'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={onCreateResume}
            icon={<FiPlus />}
            className="bg-gradient-to-r from-primary-500 to-accent-500"
          >
            Create New Resume
          </Button>

          {resumes.length > 0 && (
            <Button variant="outline" onClick={onContinue}>
              Continue Editing
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <QuickStat
          icon={FiFileText}
          label="Total Resumes"
          value={totalResumes}
          tone="blue"
        />
        <QuickStat
          icon={FiCheckCircle}
          label="Completed"
          value={completedResumes}
          tone="green"
        />
        <QuickStat
          icon={FiTarget}
          label="Avg ATS Score"
          value={`${averageScore}%`}
          tone="purple"
        />
        <QuickStat
          icon={FiDownload}
          label="Downloads"
          value={totalDownloads}
          tone="orange"
        />
      </div>
    </motion.section>
  );
};

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

  const navigate = useNavigate();
  const location = useLocation();

  const { user, userRole, logout, isPremium } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const {
    notifications = [],
    unreadCount = 0,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const { resumes = [], stats = {}, createResume } = useResume();

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = useMemo(
    () => user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there',
    [user]
  );

  const accountLabel = useMemo(() => {
    if (userRole === 'admin') {
      return 'Admin';
    }

    if (isPremium || userRole === 'premium') {
      return 'Premium';
    }

    return 'Free';
  }, [isPremium, userRole]);

  const latestResumeId = useMemo(() => resumes[0]?.id || null, [resumes]);

  const closeFloatingPanels = useCallback(() => {
    setShowQuickActions(false);
    setShowNotifications(false);
    setShowUserMenu(false);
  }, []);

  const openCreateModal = useCallback(() => {
    closeFloatingPanels();
    setShowCreateModal(true);
  }, [closeFloatingPanels]);

  const openCommandPalette = useCallback(() => {
    closeFloatingPanels();
    setShowCommandPalette(true);
  }, [closeFloatingPanels]);

  const toggleQuickActions = useCallback(() => {
    setShowNotifications(false);
    setShowUserMenu(false);
    setShowQuickActions((previous) => !previous);
  }, []);

  const toggleNotifications = useCallback(() => {
    setShowQuickActions(false);
    setShowUserMenu(false);
    setShowNotifications((previous) => !previous);
  }, []);

  const toggleUserMenu = useCallback(() => {
    setShowQuickActions(false);
    setShowNotifications(false);
    setShowUserMenu((previous) => !previous);
  }, []);

  const handleRefresh = useCallback(() => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    window.setTimeout(() => {
      window.location.reload();
    }, 250);
  }, [isRefreshing]);

  const handleLogout = useCallback(async () => {
    try {
      closeFloatingPanels();
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out.');
    }
  }, [closeFloatingPanels, logout, navigate]);

  const handleCreateResume = useCallback(
    async (template = 'modern') => {
      try {
        setIsCreatingResume(true);
        setShowCreateModal(false);

        const newResume = await createResume({ template });

        if (newResume?.id) {
          navigate(`/builder/${newResume.id}`);
          return;
        }

        navigate('/builder');
      } catch (error) {
        toast.error('Unable to create a new resume right now.');
      } finally {
        setIsCreatingResume(false);
      }
    },
    [createResume, navigate]
  );

  const handleCommandSelect = useCallback(
    (action) => {
      action();
      setShowCommandPalette(false);
      setSearchTerm('');
      setActiveCommandIndex(0);
    },
    []
  );

  const commandOptions = useMemo(
    () => [
      {
        id: 'new-resume',
        label: 'Create New Resume',
        icon: FiPlus,
        action: openCreateModal,
        shortcut: 'Ctrl+N',
      },
      {
        id: 'dashboard',
        label: 'Go to Dashboard',
        icon: FiHome,
        action: () => navigate('/dashboard'),
      },
      {
        id: 'builder',
        label: 'Resume Builder',
        icon: FiFileText,
        action: () => navigate('/builder'),
      },
      {
        id: 'templates',
        label: 'Browse Templates',
        icon: FiLayout,
        action: () => navigate('/templates'),
      },
      {
        id: 'ats-scanner',
        label: 'ATS Scanner',
        icon: FiActivity,
        action: () => navigate('/ats-scanner'),
      },
      {
        id: 'profile',
        label: 'Profile Settings',
        icon: FiUser,
        action: () => navigate('/profile'),
      },
      {
        id: 'settings',
        label: 'Account Settings',
        icon: FiSettings,
        action: () => navigate('/settings'),
      },
      {
        id: 'pricing',
        label: 'View Pricing',
        icon: FiCreditCard,
        action: () => navigate('/pricing'),
      },
      {
        id: 'help',
        label: 'Help Center',
        icon: FiHelpCircle,
        action: () => navigate('/help'),
      },
    ],
    [navigate, openCreateModal]
  );

  const filteredCommands = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return commandOptions;
    }

    return commandOptions.filter((command) =>
      command.label.toLowerCase().includes(normalizedSearch)
    );
  }, [commandOptions, searchTerm]);

  const quickActions = useMemo(
    () => [
      {
        id: 'new-resume',
        icon: FiPlus,
        label: 'New Resume',
        action: openCreateModal,
        iconClassName: 'text-blue-500',
        shortcut: 'Ctrl+N',
      },
      {
        id: 'ats-scanner',
        icon: FiActivity,
        label: 'ATS Scanner',
        action: () => navigate('/ats-scanner'),
        iconClassName: 'text-purple-500',
      },
      {
        id: 'templates',
        icon: FiLayout,
        label: 'Templates',
        action: () => navigate('/templates'),
        iconClassName: 'text-green-500',
      },
      {
        id: 'analytics',
        icon: FiTrendingUp,
        label: 'Analytics',
        action: () => navigate('/analytics'),
        iconClassName: 'text-orange-500',
        premium: true,
      },
    ],
    [navigate, openCreateModal]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        JSON.stringify(sidebarCollapsed)
      );
    } catch {
      // ignore storage errors
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    setSidebarOpen(false);
    closeFloatingPanels();
  }, [closeFloatingPanels, location.pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    if (!sidebarOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!showCommandPalette) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      document.getElementById(COMMAND_INPUT_ID)?.focus();
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [showCommandPalette]);

  useEffect(() => {
    if (!showCommandPalette) {
      setSearchTerm('');
      setActiveCommandIndex(0);
      return;
    }

    setActiveCommandIndex(0);
  }, [showCommandPalette, searchTerm]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const target = event.target;

      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(target)
      ) {
        setShowQuickActions(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const hasModifier = event.ctrlKey || event.metaKey;
      const typing = isTypingTarget(event.target);

      if (event.key === 'Escape') {
        closeFloatingPanels();
        setSidebarOpen(false);
        setShowCreateModal(false);
        setShowCommandPalette(false);
        return;
      }

      if (typing && !hasModifier) {
        return;
      }

      if (hasModifier && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openCommandPalette();
      }

      if (hasModifier && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        openCreateModal();
      }

      if (hasModifier && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setSidebarCollapsed((previous) => !previous);
      }

      if (hasModifier && event.key === '/') {
        event.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeFloatingPanels, openCommandPalette, openCreateModal]);

  const handleCommandKeyDown = useCallback(
    (event) => {
      if (filteredCommands.length === 0) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveCommandIndex((previous) =>
          previous >= filteredCommands.length - 1 ? 0 : previous + 1
        );
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveCommandIndex((previous) =>
          previous <= 0 ? filteredCommands.length - 1 : previous - 1
        );
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const selectedCommand = filteredCommands[activeCommandIndex];

        if (selectedCommand) {
          handleCommandSelect(selectedCommand.action);
        }
      }
    },
    [activeCommandIndex, filteredCommands, handleCommandSelect]
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            >
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 24, stiffness: 240 }}
                className="relative flex h-full w-72 flex-col bg-white shadow-xl dark:bg-gray-800"
                onClick={(event) => event.stopPropagation()}
                aria-label="Mobile sidebar"
              >
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500" />
                    <span className="text-lg font-bold gradient-text">ResumeAI Pro</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Close menu"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <Sidebar
                  onClose={() => setSidebarOpen(false)}
                  isMobile
                  isCollapsed={false}
                />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <aside
          className={cn(
            'fixed left-0 top-0 z-30 hidden h-full transition-all duration-300 lg:block',
            sidebarCollapsed ? 'w-20' : 'w-64'
          )}
          aria-label="Desktop sidebar"
        >
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((previous) => !previous)}
          />
        </aside>

        <div
          className={cn(
            'transition-all duration-300',
            sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          )}
        >
          <header className="sticky top-0 z-20 border-b border-gray-200/50 glass dark:border-gray-700/50">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
                    aria-label="Open menu"
                  >
                    <FiMenu className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed((previous) => !previous)}
                    className="hidden rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 lg:flex"
                    aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {sidebarCollapsed ? (
                      <FiChevronRight className="h-5 w-5" />
                    ) : (
                      <FiChevronLeft className="h-5 w-5" />
                    )}
                  </button>

                  <div className="relative hidden md:block">
                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="global-search"
                      type="search"
                      placeholder="Search dashboard..."
                      className="w-64 rounded-xl border border-gray-200 bg-white/70 py-2 pl-10 pr-16 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800/60 lg:w-80"
                      aria-label="Search dashboard"
                    />
                    <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      Ctrl+/
                    </kbd>
                  </div>

                  <div className="hidden min-w-0 lg:block">
                    <h1 className="truncate text-xl font-semibold gradient-text">
                      {title || 'Dashboard'}
                    </h1>
                    {description && (
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {isPremium && (
                    <Tooltip content="Premium Member">
                      <Badge
                        variant="warning"
                        className="hidden items-center gap-1 sm:inline-flex"
                      >
                        <FiAward className="h-3 w-3" />
                        PRO
                      </Badge>
                    </Tooltip>
                  )}

                  <Tooltip content="Command Palette (Ctrl+K)">
                    <button
                      type="button"
                      onClick={openCommandPalette}
                      className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
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
                      className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
                      aria-label="Refresh dashboard"
                    >
                      <FiRefreshCw
                        className={cn('h-5 w-5', isRefreshing && 'animate-spin')}
                      />
                    </button>
                  </Tooltip>

                  <div className="relative hidden sm:block" ref={quickActionsRef}>
                    <Tooltip content="Quick actions">
                      <button
                        type="button"
                        onClick={toggleQuickActions}
                        className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Open quick actions"
                        aria-expanded={showQuickActions}
                        aria-haspopup="menu"
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
                          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
                          role="menu"
                          aria-label="Quick actions"
                        >
                          <div className="p-2">
                            <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                              Quick Actions
                            </p>

                            {quickActions.map((action) => {
                              const isLocked = action.premium && !isPremium;

                              return (
                                <button
                                  key={action.id}
                                  type="button"
                                  onClick={() => {
                                    if (isLocked) {
                                      navigate('/pricing');
                                      setShowQuickActions(false);
                                      return;
                                    }

                                    action.action();
                                    setShowQuickActions(false);
                                  }}
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                  role="menuitem"
                                  aria-disabled={isLocked}
                                >
                                  <action.icon className={cn('h-4 w-4', action.iconClassName)} />
                                  <span className="flex-1 text-sm">{action.label}</span>
                                  {isLocked && <FiStar className="h-3 w-3 text-yellow-500" />}
                                  {action.shortcut && (
                                    <span className="text-xs text-gray-400">
                                      {action.shortcut}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative" ref={notificationsRef}>
                    <button
                      type="button"
                      onClick={toggleNotifications}
                      className="relative rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Open notifications"
                      aria-expanded={showNotifications}
                      aria-haspopup="menu"
                    >
                      <FiBell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge
                          variant="danger"
                          size="sm"
                          className="absolute -right-1 -top-1"
                        >
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
                          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
                          role="menu"
                          aria-label="Notifications"
                        >
                          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                            <h3 className="font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                              <button
                                type="button"
                                onClick={() => void markAllAsRead?.()}
                                className="text-xs text-primary-500 transition-colors hover:text-primary-600"
                              >
                                Mark all read
                              </button>
                            )}
                          </div>

                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.slice(0, 5).map((notification) => {
                                const meta = getNotificationMeta(notification.type);
                                const NotificationIcon = meta.icon;

                                return (
                                  <button
                                    key={notification.id}
                                    type="button"
                                    onClick={() => void markAsRead?.(notification.id)}
                                    className={cn(
                                      'flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-700/50',
                                      !notification.read &&
                                        'bg-blue-50/40 dark:bg-blue-900/10'
                                    )}
                                    role="menuitem"
                                  >
                                    <div className={cn('rounded-lg p-2', meta.className)}>
                                      <NotificationIcon className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {notification.title}
                                      </p>
                                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                        {notification.message}
                                      </p>
                                      {notification.time && (
                                        <p className="mt-1 text-xs text-gray-400">
                                          {notification.time}
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-8 text-center">
                                <FiBell className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  No notifications
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-gray-200 p-3 dark:border-gray-700">
                            <button
                              type="button"
                              onClick={() => {
                                setShowNotifications(false);
                                navigate('/notifications');
                              }}
                              className="w-full text-center text-sm text-primary-500 transition-colors hover:text-primary-600"
                            >
                              View all notifications
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                      {isDark ? (
                        <FiSun className="h-5 w-5" />
                      ) : (
                        <FiMoon className="h-5 w-5" />
                      )}
                    </button>
                  </Tooltip>

                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={toggleUserMenu}
                      className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Open user menu"
                      aria-expanded={showUserMenu}
                      aria-haspopup="menu"
                    >
                      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-primary-500 to-accent-500 font-semibold text-white">
                        {user?.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={`${firstName} avatar`}
                            className="h-8 w-8 object-cover"
                          />
                        ) : (
                          (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
                        )}
                      </div>

                      <div className="hidden text-left lg:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {firstName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {accountLabel}
                        </p>
                      </div>

                      <FiChevronDown className="hidden h-4 w-4 lg:block" />
                    </button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: -8 }}
                          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
                          role="menu"
                          aria-label="User menu"
                        >
                          <div className="border-b border-gray-200 p-3 dark:border-gray-700">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user?.displayName || 'User'}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {user?.email}
                            </p>

                            {!isPremium && (
                              <Button
                                size="sm"
                                variant="warning"
                                onClick={() => {
                                  setShowUserMenu(false);
                                  navigate('/pricing');
                                }}
                                className="mt-2 w-full"
                              >
                                Upgrade to Pro
                              </Button>
                            )}
                          </div>

                          <div className="p-2">
                            {[
                              {
                                id: 'profile',
                                icon: FiUser,
                                label: 'Profile Settings',
                                path: '/profile',
                              },
                              {
                                id: 'settings',
                                icon: FiSettings,
                                label: 'Account Settings',
                                path: '/settings',
                              },
                              {
                                id: 'billing',
                                icon: FiCreditCard,
                                label: 'Billing',
                                path: '/billing',
                              },
                            ].map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setShowUserMenu(false);
                                  navigate(item.path);
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
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
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                              role="menuitem"
                            >
                              <FiLogOut className="h-4 w-4" />
                              <span className="text-sm">Sign Out</span>
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
            <div className="mb-4 lg:hidden">
              <h1 className="text-2xl font-bold gradient-text">{title || 'Dashboard'}</h1>
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
              )}
            </div>

            {showWelcome && location.pathname === '/dashboard' && (
              <WelcomeCard
                greeting={greeting}
                firstName={firstName}
                stats={stats}
                resumes={resumes}
                onCreateResume={openCreateModal}
                onContinue={() =>
                  navigate(latestResumeId ? `/builder/${latestResumeId}` : '/builder')
                }
              />
            )}

            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </main>

          <footer className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="flex flex-col items-center justify-between gap-2 text-center text-xs text-gray-500 sm:flex-row sm:text-left">
              <p>© {new Date().getFullYear()} ResumeAI Pro. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link to="/privacy" className="transition-colors hover:text-primary-500">
                  Privacy
                </Link>
                <Link to="/terms" className="transition-colors hover:text-primary-500">
                  Terms
                </Link>
                <Link to="/help" className="transition-colors hover:text-primary-500">
                  Help
                </Link>
              </div>
            </div>
          </footer>
        </div>

        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Choose a Template"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a template to start your resume.
            </p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {templates.map((template) => (
                <motion.button
                  key={template.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCreateResume(template.id)}
                  disabled={isCreatingResume}
                  className="group rounded-xl border border-gray-200 p-4 text-left transition-all hover:border-primary-300 dark:border-gray-700 dark:hover:border-primary-700 disabled:pointer-events-none disabled:opacity-60"
                >
                  <div
                    className={cn(
                      'mb-3 flex h-24 w-full items-center justify-center rounded-lg bg-gradient-to-br text-3xl transition-transform group-hover:scale-[1.02]',
                      template.previewClass
                    )}
                  >
                    {template.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {template.description}
                  </p>
                </motion.button>
              ))}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          title="Command Palette"
          size="md"
        >
          <div className="space-y-3">
            <Input
              id={COMMAND_INPUT_ID}
              icon={<FiSearch />}
              placeholder="Type a command or search..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={handleCommandKeyDown}
              autoComplete="off"
            />

            <div className="max-h-80 overflow-y-auto">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    type="button"
                    onClick={() => handleCommandSelect(command.action)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors',
                      index === activeCommandIndex
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <command.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm">{command.label}</span>
                    </span>

                    {command.shortcut && (
                      <kbd className="text-xs text-gray-400">{command.shortcut}</kbd>
                    )}
                  </button>
                ))
              ) : (
                <p className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No commands found.
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-2 text-center text-xs text-gray-400 dark:border-gray-700">
              <span className="inline-flex items-center gap-2">
                <kbd className="rounded border px-1.5 py-0.5">↑↓</kbd>
                <span>navigate</span>
                <kbd className="rounded border px-1.5 py-0.5">Enter</kbd>
                <span>select</span>
                <kbd className="rounded border px-1.5 py-0.5">Esc</kbd>
                <span>close</span>
              </span>
            </div>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardLayout;
