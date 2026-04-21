import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  FiMenu, FiX, FiBell, FiSearch, FiUser, FiLogOut,
  FiSettings, FiHelpCircle, FiMoon, FiSun, FiChevronDown,
  FiRefreshCw, FiHome, FiFileText, FiLayout, FiActivity,
  FiAward, FiCreditCard, FiMessageSquare, FiCheckCircle,
  FiAlertCircle, FiInfo, FiZap, FiPlus, FiDownload,
  FiEye, FiShare2, FiBookmark, FiTrendingUp, FiTarget,
  FiClock, FiCalendar, FiUsers, FiStar, FiCommand,
  FiChevronLeft, FiChevronRight, FiList, FiGrid,
} from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useResume } from '../contexts/ResumeContext';
import { useSettings } from '../contexts/SettingsContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import Tooltip from '../components/ui/Tooltip';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

// ============================================
// DASHBOARD LAYOUT COMPONENT
// ============================================

const DashboardLayout = ({ children, title, description, showWelcome = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('dashboardSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const commandInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isPremium } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { resumes, stats, createResume } = useResume();

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('dashboardSidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K for command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Ctrl/Cmd + N for new resume
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowCreateModal(true);
      }
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
      // Ctrl/Cmd + / for search
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowQuickActions(false);
        setShowNotifications(false);
        setShowUserMenu(false);
        setSidebarOpen(false);
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus command input when palette opens
  useEffect(() => {
    if (showCommandPalette) {
      setTimeout(() => commandInputRef.current?.focus(), 100);
    }
  }, [showCommandPalette]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const handleCreateResume = async (template = 'modern') => {
    setShowCreateModal(false);
    try {
      const newResume = await createResume({ template });
      navigate(`/builder/${newResume.id}`);
    } catch (error) {
      // Error handled in context
    }
  };

  // Command palette options
  const commandOptions = [
    { id: 'new-resume', label: 'Create New Resume', icon: FiPlus, action: () => setShowCreateModal(true), shortcut: '⌘N' },
    { id: 'dashboard', label: 'Go to Dashboard', icon: FiHome, action: () => navigate('/dashboard'), shortcut: '⌘D' },
    { id: 'builder', label: 'Resume Builder', icon: FiFileText, action: () => navigate('/builder') },
    { id: 'templates', label: 'Browse Templates', icon: FiLayout, action: () => navigate('/templates') },
    { id: 'ats-scanner', label: 'ATS Scanner', icon: FiActivity, action: () => navigate('/ats-scanner') },
    { id: 'profile', label: 'Profile Settings', icon: FiUser, action: () => navigate('/profile'), shortcut: '⌘P' },
    { id: 'settings', label: 'Account Settings', icon: FiSettings, action: () => navigate('/settings') },
    { id: 'pricing', label: 'View Pricing', icon: FiCreditCard, action: () => navigate('/pricing') },
    { id: 'help', label: 'Help Center', icon: FiHelpCircle, action: () => navigate('/help') },
  ];

  const filteredCommands = commandOptions.filter(cmd =>
    cmd.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quickActions = [
    { icon: FiPlus, label: 'New Resume', action: () => setShowCreateModal(true), color: 'text-blue-500', shortcut: '⌘N' },
    { icon: FiActivity, label: 'ATS Scanner', action: () => navigate('/ats-scanner'), color: 'text-purple-500' },
    { icon: FiLayout, label: 'Templates', action: () => navigate('/templates'), color: 'text-green-500' },
    { icon: FiTrendingUp, label: 'Analytics', action: () => navigate('/analytics'), color: 'text-orange-500', premium: true },
  ];

  const templates = [
    { id: 'modern', name: 'Modern', icon: '🎨', color: 'from-blue-500 to-cyan-500', description: 'Clean & contemporary' },
    { id: 'classic', name: 'Classic', icon: '📄', color: 'from-gray-600 to-gray-800', description: 'Traditional format' },
    { id: 'creative', name: 'Creative', icon: '✨', color: 'from-purple-500 to-pink-500', description: 'Stand out design' },
    { id: 'minimal', name: 'Minimal', icon: '◻️', color: 'from-green-500 to-emerald-500', description: 'Simple & elegant' },
    { id: 'executive', name: 'Executive', icon: '👔', color: 'from-slate-700 to-slate-900', description: 'Senior positions' },
    { id: 'tech', name: 'Tech', icon: '💻', color: 'from-indigo-500 to-blue-600', description: 'Tech industry focus' },
  ];

  const WelcomeCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 mb-6 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-text mb-1">
            {greeting}, {user?.displayName?.split(' ')[0] || 'there'}! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {stats?.total > 0
              ? `You have ${stats.total} resume${stats.total !== 1 ? 's' : ''} with an average ATS score of ${stats.avgScore || 0}%`
              : 'Ready to create your first professional resume?'}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<FiPlus />}
            className="bg-gradient-to-r from-primary-500 to-accent-500"
          >
            Create New Resume
          </Button>
          {resumes.length > 0 && (
            <Button
              variant="outline"
              onClick={() => navigate(`/builder/${resumes[0].id}`)}
            >
              Continue Editing
            </Button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <QuickStat icon={FiFileText} label="Total Resumes" value={stats.total || 0} color="text-blue-500" />
          <QuickStat icon={FiCheckCircle} label="Completed" value={stats.completed || 0} color="text-green-500" />
          <QuickStat icon={FiTarget} label="Avg ATS Score" value={`${stats.avgScore || 0}%`} color="text-purple-500" />
          <QuickStat icon={FiDownload} label="Downloads" value={stats.totalDownloads || 0} color="text-orange-500" />
        </div>
      )}
    </motion.div>
  );

  const QuickStat = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <div className={`p-2 rounded-lg bg-${color.split('-')[1]}-100 dark:bg-${color.split('-')[1]}-900/30`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 25 }}
                className="relative flex flex-col w-72 h-full bg-white dark:bg-gray-800 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg" />
                    <span className="font-bold text-lg gradient-text">ResumeAI Pro</span>
                  </Link>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <Sidebar onClose={() => setSidebarOpen(false)} isMobile isCollapsed={false} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className={`hidden lg:block fixed top-0 left-0 h-full z-30 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
          <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        </div>

        {/* Main Content */}
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-20 glass border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
                    aria-label="Open menu"
                  >
                    <FiMenu className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {sidebarCollapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
                  </button>

                  <div className="hidden md:block relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      id="global-search"
                      type="text"
                      placeholder="Search... (⌘/)"
                      className="w-64 lg:w-80 pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                    <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">⌘/</kbd>
                  </div>

                  <div className="hidden lg:block">
                    <h1 className="text-xl font-semibold gradient-text">{title || 'Dashboard'}</h1>
                    {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {isPremium && (
                    <Tooltip content="Premium Member">
                      <Badge variant="warning" className="hidden sm:flex items-center gap-1">
                        <FiAward className="w-3 h-3" /> PRO
                      </Badge>
                    </Tooltip>
                  )}

                  <Tooltip content="Command Palette (⌘K)">
                    <button
                      onClick={() => setShowCommandPalette(true)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <FiCommand className="w-5 h-5" />
                    </button>
                  </Tooltip>

                  <Tooltip content="Refresh">
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </Tooltip>

                  {/* Quick Actions Dropdown */}
                  <div className="relative hidden sm:block">
                    <Tooltip content="Quick actions">
                      <button
                        onClick={() => setShowQuickActions(!showQuickActions)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <FiZap className="w-5 h-5" />
                      </button>
                    </Tooltip>

                    <AnimatePresence>
                      {showQuickActions && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                        >
                          <div className="p-2">
                            <p className="text-xs text-gray-500 px-3 py-2">Quick Actions</p>
                            {quickActions.map((action, index) => (
                              <button
                                key={index}
                                onClick={() => { action.action(); setShowQuickActions(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                disabled={action.premium && !isPremium}
                              >
                                <action.icon className={`w-4 h-4 ${action.color}`} />
                                <span className="text-sm flex-1 text-left">{action.label}</span>
                                {action.premium && !isPremium && <FiStar className="w-3 h-3 text-yellow-500" />}
                                {action.shortcut && <span className="text-xs text-gray-400">{action.shortcut}</span>}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                    >
                      <FiBell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <Badge variant="danger" size="sm" className="absolute -top-1 -right-1">{unreadCount}</Badge>
                      )}
                    </button>

                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                        >
                          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">Notifications</h3>
                              {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-xs text-primary-500 hover:text-primary-600">
                                  Mark all read
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.slice(0, 5).map(notification => (
                                <div
                                  key={notification.id}
                                  className={`p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-600' : notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : notification.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                      {notification.type === 'success' && <FiCheckCircle className="w-4 h-4" />}
                                      {notification.type === 'warning' && <FiAlertCircle className="w-4 h-4" />}
                                      {notification.type === 'error' && <FiAlertCircle className="w-4 h-4" />}
                                      {!notification.type && <FiInfo className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{notification.title}</p>
                                      <p className="text-xs text-gray-500">{notification.message}</p>
                                      <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center">
                                <FiBell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No notifications</p>
                              </div>
                            )}
                          </div>
                          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                              className="w-full text-center text-sm text-primary-500 hover:text-primary-600"
                            >
                              View all notifications
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Theme Toggle */}
                  <Tooltip content={isDark ? 'Light mode' : 'Dark mode'}>
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                    </button>
                  </Tooltip>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="hidden lg:block text-left">
                        <p className="text-sm font-medium">{user?.displayName?.split(' ')[0] || 'User'}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role || 'Free'}</p>
                      </div>
                      <FiChevronDown className="hidden lg:block w-4 h-4" />
                    </button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                        >
                          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                            <p className="font-medium">{user?.displayName || 'User'}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                            {!isPremium && (
                              <Button
                                size="sm"
                                variant="warning"
                                onClick={() => { setShowUserMenu(false); navigate('/pricing'); }}
                                className="mt-2 w-full"
                              >
                                Upgrade to Pro
                              </Button>
                            )}
                          </div>
                          <div className="p-2">
                            {[
                              { icon: FiUser, label: 'Profile Settings', path: '/profile' },
                              { icon: FiSettings, label: 'Account Settings', path: '/settings' },
                              { icon: FiCreditCard, label: 'Billing', path: '/billing' },
                            ].map((item, i) => (
                              <button
                                key={i}
                                onClick={() => { setShowUserMenu(false); navigate(item.path); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <item.icon className="w-4 h-4" />
                                <span className="text-sm">{item.label}</span>
                              </button>
                            ))}
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <FiLogOut className="w-4 h-4" />
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

          {/* Main Content Area */}
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="lg:hidden mb-4">
              <h1 className="text-2xl font-bold gradient-text">{title || 'Dashboard'}</h1>
              {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
            </div>

            {showWelcome && location.pathname === '/dashboard' && <WelcomeCard />}

            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>

          {/* Footer */}
          <footer className="mt-auto py-4 px-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
              <p>© {new Date().getFullYear()} ResumeAI Pro. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link to="/privacy" className="hover:text-primary-500 transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-primary-500 transition-colors">Terms</Link>
                <Link to="/help" className="hover:text-primary-500 transition-colors">Help</Link>
              </div>
            </div>
          </footer>
        </div>

        {/* Create Resume Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Choose a Template" size="lg">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Select a template to start your resume</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {templates.map(template => (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCreateResume(template.id)}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all text-left group"
                >
                  <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${template.color} mb-3 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform`}>
                    {template.icon}
                  </div>
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </motion.button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            </div>
          </div>
        </Modal>

        {/* Command Palette Modal */}
        <Modal isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} title="Command Palette" size="md">
          <div className="space-y-3">
            <Input
              ref={commandInputRef}
              icon={<FiSearch />}
              placeholder="Type a command or search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="max-h-80 overflow-y-auto">
              {filteredCommands.length > 0 ? (
                filteredCommands.map(cmd => (
                  <button
                    key={cmd.id}
                    onClick={() => { cmd.action(); setShowCommandPalette(false); setSearchTerm(''); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <cmd.icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{cmd.label}</span>
                    </span>
                    {cmd.shortcut && <kbd className="text-xs text-gray-400">{cmd.shortcut}</kbd>}
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No commands found</p>
              )}
            </div>
            <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <kbd className="px-1">↑↓</kbd> to navigate • <kbd className="px-1">Enter</kbd> to select • <kbd className="px-1">Esc</kbd> to close
            </div>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardLayout;