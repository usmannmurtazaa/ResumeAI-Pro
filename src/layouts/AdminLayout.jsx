import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiMenu, 
  FiX, 
  FiBell, 
  FiSearch, 
  FiUser, 
  FiLogOut,
  FiSettings,
  FiHelpCircle,
  FiMoon,
  FiSun,
  FiChevronDown,
  FiRefreshCw,
  FiShield,
  FiActivity,
  FiUsers,
  FiFileText,
  FiBarChart2,
  FiCreditCard,
  FiMessageSquare,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiZap
} from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Tooltip from '../components/ui/Tooltip';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

const AdminLayout = ({ children, title, description }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  
  // Check if user is admin
  const isAdmin = hasRole('admin');

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      toast.error('You do not have permission to access the admin area');
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  // Save sidebar preference
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowQuickActions(false);
        setShowNotifications(false);
        setShowUserMenu(false);
        setMobileSidebarOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
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

  const quickActions = [
    { 
      icon: FiUsers, 
      label: 'View Users', 
      action: () => navigate('/admin/users'),
      color: 'text-blue-500'
    },
    { 
      icon: FiFileText, 
      label: 'Manage Resumes', 
      action: () => navigate('/admin/resumes'),
      color: 'text-purple-500'
    },
    { 
      icon: FiBarChart2, 
      label: 'Analytics', 
      action: () => navigate('/admin/analytics'),
      color: 'text-green-500'
    },
    { 
      icon: FiSettings, 
      label: 'Settings', 
      action: () => navigate('/admin/settings'),
      color: 'text-gray-500'
    }
  ];

  // System status indicator
  const SystemStatus = () => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full">
      <div className="relative">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
      </div>
      <span className="text-xs text-green-600 dark:text-green-400">System Online</span>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <div className={`
          fixed top-0 left-0 h-full z-50 transition-transform duration-300 lg:translate-x-0
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar 
            isCollapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            isAdmin={true}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        </div>

        {/* Main Content */}
        <div className={`
          transition-all duration-300
          ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
        `}>
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-30 glass border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setMobileSidebarOpen(true)}
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
                    <FiMenu className="w-5 h-5" />
                  </button>

                  {/* Breadcrumb / Page Title */}
                  <div className="hidden sm:block">
                    <h1 className="text-xl font-semibold gradient-text">
                      {title || 'Admin Dashboard'}
                    </h1>
                    {description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* System Status */}
                  <div className="hidden md:block">
                    <SystemStatus />
                  </div>

                  {/* Search */}
                  <Tooltip content="Search (Ctrl+K)">
                    <button
                      onClick={() => navigate('/admin/search')}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <FiSearch className="w-5 h-5" />
                    </button>
                  </Tooltip>

                  {/* Refresh */}
                  <Tooltip content="Refresh data">
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </Tooltip>

                  {/* Quick Actions */}
                  <div className="relative">
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
                                onClick={() => {
                                  action.action();
                                  setShowQuickActions(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                              >
                                <action.icon className={`w-4 h-4 ${action.color}`} />
                                <span className="text-sm flex-1 text-left">{action.label}</span>
                                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                  ⌘{index + 1}
                                </span>
                              </button>
                            ))}
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                            <button
                              onClick={() => {
                                setShowQuickActions(false);
                                navigate('/admin/settings');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <FiSettings className="w-4 h-4" />
                              <span className="text-sm">Advanced Settings</span>
                            </button>
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
                        <Badge variant="danger" size="sm" className="absolute -top-1 -right-1">
                          {unreadCount}
                        </Badge>
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
                                <button
                                  onClick={markAllAsRead}
                                  className="text-xs text-primary-500 hover:text-primary-600"
                                >
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
                                  className={`p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                  }`}
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${
                                      notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                      notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                      notification.type === 'error' ? 'bg-red-100 text-red-600' :
                                      'bg-blue-100 text-blue-600'
                                    }`}>
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
                              onClick={() => {
                                setShowNotifications(false);
                                navigate('/admin/notifications');
                              }}
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'
                        )}
                      </div>
                      <div className="hidden lg:block text-left">
                        <p className="text-sm font-medium">{user?.displayName || 'Admin'}</p>
                        <p className="text-xs text-gray-500">Administrator</p>
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
                            <p className="font-medium">{user?.displayName || 'Admin User'}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                            <Badge variant="danger" size="sm" className="mt-1">Admin</Badge>
                          </div>
                          <div className="p-2">
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                navigate('/admin/profile');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <FiUser className="w-4 h-4" />
                              <span className="text-sm">Profile Settings</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                navigate('/admin/help');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <FiHelpCircle className="w-4 h-4" />
                              <span className="text-sm">Help & Support</span>
                            </button>
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
            {/* Admin Badge (Mobile) */}
            <div className="lg:hidden mb-4">
              <Badge variant="danger" className="flex items-center gap-1 w-fit">
                <FiShield className="w-3 h-3" />
                Admin Mode
              </Badge>
            </div>

            {/* Page Header (Mobile) */}
            <div className="sm:hidden mb-6">
              <h1 className="text-2xl font-bold gradient-text">
                {title || 'Admin Dashboard'}
              </h1>
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>

            {/* Content */}
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
              <p>© {new Date().getFullYear()} ATS Resume Builder. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSystemStatus(true)}
                  className="hover:text-primary-500 transition-colors"
                >
                  System Status
                </button>
                <span>v{process.env.REACT_APP_VERSION || '2.0.0'}</span>
              </div>
            </div>
          </footer>
        </div>

        {/* System Status Modal */}
        <Modal
          isOpen={showSystemStatus}
          onClose={() => setShowSystemStatus(false)}
          title="System Status"
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <StatusCard label="API" status="operational" />
              <StatusCard label="Database" status="operational" />
              <StatusCard label="Storage" status="operational" />
              <StatusCard label="Functions" status="operational" />
              <StatusCard label="Authentication" status="operational" />
              <StatusCard label="Email Service" status="operational" />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

// Status Card Component
const StatusCard = ({ label, status }) => {
  const statusConfig = {
    operational: { color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Operational' },
    degraded: { color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Degraded' },
    outage: { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Outage' }
  };
  
  const config = statusConfig[status] || statusConfig.operational;
  
  return (
    <div className={`p-3 rounded-lg ${config.bg}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className={`text-xs ${config.color} flex items-center gap-1`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text', 'bg')}`} />
        {config.label}
      </p>
    </div>
  );
};

export default AdminLayout;