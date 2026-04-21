import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiFileText, FiUser, FiSettings, FiLogOut,
  FiLayout, FiUsers, FiPieChart, FiActivity, FiTarget,
  FiAward, FiCreditCard, FiHelpCircle, FiChevronLeft,
  FiChevronRight, FiZap, FiStar, FiShield, FiBookOpen,
  FiMessageSquare, FiBell, FiTrendingUp, FiBriefcase,
  FiGlobe, FiDatabase, FiKey, FiTerminal, FiCloud,
  FiChevronDown, FiChevronUp, FiPlus, FiSearch,
  FiDownload, FiShare2, FiEye, FiEdit3, FiTrash2,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useResume } from '../../contexts/ResumeContext';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';
import Avatar from '../ui/Avatar';
import Progress from '../ui/Progress';
import toast from 'react-hot-toast';

// ============================================
// SIDEBAR COMPONENT
// ============================================

const Sidebar = ({ isCollapsed = false, onToggle, isMobile = false, onCloseMobile, isAdmin = false }) => {
  const { user, logout, userRole, isPremium, userData } = useAuth();
  const { isDark } = useTheme();
  const { stats } = useResume();
  const location = useLocation();
  
  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('sidebarExpandedSections');
    return saved ? JSON.parse(saved) : { main: true, admin: true, analytics: false, account: true };
  });
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(() => {
    return localStorage.getItem('hideUpgradePrompt') !== 'true';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Save expanded sections
  useEffect(() => {
    localStorage.setItem('sidebarExpandedSections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  // Determine if admin mode
  const isAdminMode = isAdmin || userRole === 'admin';

  // User menu items with dynamic counts
  const userMenuItems = useMemo(() => [
    { 
      path: '/dashboard', 
      icon: FiHome, 
      label: 'Dashboard',
      exact: true,
      shortcut: '⌘D'
    },
    { 
      path: '/builder', 
      icon: FiPlus, 
      label: 'New Resume',
      highlight: true,
      shortcut: '⌘N'
    },
    { 
      path: '/my-resumes', 
      icon: FiFileText, 
      label: 'My Resumes',
      count: stats?.total || 0
    },
    { 
      path: '/templates', 
      icon: FiLayout, 
      label: 'Templates',
      badge: 'New'
    },
    { 
      path: '/ats-scanner', 
      icon: FiTarget, 
      label: 'ATS Scanner',
      shortcut: '⌘S'
    },
    { 
      path: '/analytics', 
      icon: FiTrendingUp, 
      label: 'Analytics',
      premium: true
    },
    { 
      path: '/cover-letter', 
      icon: FiBriefcase, 
      label: 'Cover Letter',
      premium: true,
      badge: 'Beta'
    }
  ], [stats?.total]);

  // Admin menu items
  const adminMenuItems = useMemo(() => [
    {
      section: 'overview',
      label: 'Overview',
      items: [
        { path: '/admin', icon: FiPieChart, label: 'Dashboard', exact: true },
        { path: '/admin/analytics', icon: FiActivity, label: 'Analytics' },
        { path: '/admin/activity', icon: FiTrendingUp, label: 'Activity Log' },
      ]
    },
    {
      section: 'management',
      label: 'Management',
      items: [
        { path: '/admin/users', icon: FiUsers, label: 'Users' },
        { path: '/admin/resumes', icon: FiFileText, label: 'Resumes' },
        { path: '/admin/templates', icon: FiLayout, label: 'Templates' },
        { path: '/admin/subscriptions', icon: FiCreditCard, label: 'Subscriptions' },
      ]
    },
    {
      section: 'system',
      label: 'System',
      items: [
        { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
        { path: '/admin/logs', icon: FiTerminal, label: 'System Logs' },
        { path: '/admin/feature-flags', icon: FiZap, label: 'Feature Flags' },
        { path: '/admin/database', icon: FiDatabase, label: 'Database' },
        { path: '/admin/api-keys', icon: FiKey, label: 'API Keys' },
      ]
    }
  ], []);

  // Account items
  const accountItems = useMemo(() => [
    { path: '/profile', icon: FiUser, label: 'Profile', shortcut: '⌘P' },
    { path: '/settings', icon: FiSettings, label: 'Settings', shortcut: '⌘,' },
    { path: '/billing', icon: FiCreditCard, label: 'Billing', premium: true },
    { path: '/api-keys', icon: FiKey, label: 'API Keys', premium: true },
    { path: '/help', icon: FiHelpCircle, label: 'Help & Support' },
  ], []);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      onCloseMobile?.();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  }, [logout, onCloseMobile]);

  const handleHideUpgradePrompt = useCallback(() => {
    setShowUpgradePrompt(false);
    localStorage.setItem('hideUpgradePrompt', 'true');
  }, []);

  const isActive = useCallback((path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const renderMenuItem = (item) => {
    const active = isActive(item.path, item.exact);
    
    return (
      <Tooltip 
        key={item.path} 
        content={isCollapsed ? (
          <div className="text-center">
            <p className="font-medium">{item.label}</p>
            {item.shortcut && <kbd className="text-xs opacity-70">{item.shortcut}</kbd>}
          </div>
        ) : null} 
        position="right"
      >
        <NavLink
          to={item.path}
          onClick={onCloseMobile}
          className={({ isActive: navActive }) =>
            `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              active || navActive
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md'
                : item.highlight
                  ? 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            } ${isCollapsed ? 'justify-center' : ''}`
          }
        >
          <div className="relative">
            <item.icon className={`w-5 h-5 flex-shrink-0 ${!isCollapsed && active ? 'text-white' : ''}`} />
            {item.premium && !isPremium && !active && (
              <FiStar className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" />
            )}
          </div>
          
          {!isCollapsed && (
            <>
              <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {item.badge && (
                  <Badge variant="primary" size="sm">{item.badge}</Badge>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <Badge variant="secondary" size="sm">{item.count}</Badge>
                )}
                {item.shortcut && (
                  <kbd className="hidden group-hover:block text-xs opacity-70">{item.shortcut}</kbd>
                )}
                {item.premium && !isPremium && (
                  <FiStar className="w-3 h-3 text-yellow-500" />
                )}
              </div>
            </>
          )}
          
          {/* Active Indicator */}
          {active && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 w-1 h-8 bg-white rounded-r-full"
              style={{ left: isCollapsed ? -8 : -16 }}
            />
          )}
        </NavLink>
      </Tooltip>
    );
  };

  return (
    <aside className={`
      fixed left-0 top-0 h-full glass border-r border-white/20 dark:border-gray-700/20 z-40
      transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-20' : 'w-64'}
      ${isMobile ? 'w-64' : ''}
    `}>
      {/* Collapse Toggle (Desktop) */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm z-50"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <FiChevronRight className="w-3 h-3" />
          ) : (
            <FiChevronLeft className="w-3 h-3" />
          )}
        </button>
      )}

      {/* Sidebar Content */}
      <div className="h-full flex flex-col pt-16">
        {/* User Profile Section */}
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-4 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <Avatar 
                src={user?.photoURL} 
                name={user?.displayName || user?.email || 'User'} 
                size="md"
                status={isPremium ? 'premium' : (isAdminMode ? 'admin' : 'online')}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {user?.displayName?.split(' ')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {isAdminMode ? (
                    <Badge variant="danger" size="sm">Admin</Badge>
                  ) : (
                    <Badge variant={isPremium ? 'warning' : 'secondary'} size="sm">
                      {isPremium ? 'Pro' : 'Free'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            {!isAdminMode && stats && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-lg font-bold">{stats.total || 0}</p>
                  <p className="text-xs text-gray-500">Resumes</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-lg font-bold">{stats.avgScore || 0}%</p>
                  <p className="text-xs text-gray-500">ATS Score</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Search Bar (Collapsed Mode Quick Access) */}
        {isCollapsed && (
          <div className="px-2 py-3">
            <Tooltip content="Search" position="right">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                <FiSearch className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        )}

        {/* Upgrade Prompt */}
        {!isPremium && !isAdminMode && !isCollapsed && showUpgradePrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3"
          >
            <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <FiAward className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    Upgrade to Pro
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Get unlimited resumes, AI features, and priority support
                  </p>
                  <NavLink
                    to="/pricing"
                    className="inline-block mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700"
                  >
                    Upgrade Now →
                  </NavLink>
                </div>
                <button
                  onClick={handleHideUpgradePrompt}
                  className="text-amber-500 hover:text-amber-600"
                  aria-label="Dismiss"
                >
                  <FiChevronUp className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto scrollbar-thin">
          {isAdminMode ? (
            // Admin Menu
            adminMenuItems.map((section) => (
              <div key={section.section}>
                {!isCollapsed && (
                  <button
                    onClick={() => toggleSection(section.section)}
                    className="w-full flex items-center justify-between px-3 py-1 mb-2"
                  >
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {section.label}
                    </span>
                    {expandedSections[section.section] ? (
                      <FiChevronUp className="w-3 h-3 text-gray-400" />
                    ) : (
                      <FiChevronDown className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                )}
                
                <AnimatePresence>
                  {(isCollapsed || expandedSections[section.section]) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1"
                    >
                      {section.items.map(item => renderMenuItem(item))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            // User Menu
            <div className="space-y-1">
              {userMenuItems.map(item => renderMenuItem(item))}
            </div>
          )}

          {/* Account Section */}
          {!isCollapsed && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => toggleSection('account')}
                className="w-full flex items-center justify-between px-3 py-1 mb-2"
              >
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Account
                </span>
                {expandedSections.account ? (
                  <FiChevronUp className="w-3 h-3 text-gray-400" />
                ) : (
                  <FiChevronDown className="w-3 h-3 text-gray-400" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.account && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1"
                  >
                    {accountItems.map(item => renderMenuItem(item))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        {/* Footer Section */}
        <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Storage Usage (Premium) */}
          {isPremium && !isAdminMode && !isCollapsed && (
            <div className="px-3 py-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Storage</span>
                <span className="text-gray-700 dark:text-gray-300">2.4 GB / 10 GB</span>
              </div>
              <Progress value={24} size="sm" />
            </div>
          )}

          {/* Logout Button */}
          <Tooltip content={isCollapsed ? 'Logout' : null} position="right">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <FiLogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </Tooltip>

          {/* Version Info */}
          {!isCollapsed && (
            <p className="text-center text-xs text-gray-400">
              v{process.env.REACT_APP_VERSION || '2.5.0'}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

// Add custom scrollbar styles
const style = document.createElement('style');
style.textContent = `
  .scrollbar-thin::-webkit-scrollbar {
    width: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.5);
    border-radius: 2px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.7);
  }
`;
if (!document.querySelector('#sidebar-scrollbar-styles')) {
  style.id = 'sidebar-scrollbar-styles';
  document.head.appendChild(style);
}

export default React.memo(Sidebar);