import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiFileText, FiUser, FiSettings, FiLogOut,
  FiLayout, FiUsers, FiPieChart, FiActivity, FiTarget,
  FiAward, FiCreditCard, FiHelpCircle, FiChevronLeft,
  FiChevronRight, FiZap, FiStar, FiShield,
  FiChevronDown, FiChevronUp, FiPlus, FiSearch,
  FiTrendingUp, FiBriefcase,
  FiDatabase, FiKey, FiTerminal,
  FiX, FiBarChart2,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useResumeContext } from '../../contexts/ResumeContext';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';
import Avatar from '../ui/Avatar';
import Progress from '../ui/Progress';
import toast from 'react-hot-toast';

// ── Component ──────────────────────────────────────────────────────────────

const Sidebar = ({ 
  isCollapsed = false, 
  onToggle, 
  isMobile = false, 
  onCloseMobile, 
  isAdmin = false 
}) => {
  const { user, logout, userRole } = useAuth();
  const { stats } = useResumeContext?.() || { stats: { total: 0, avgScore: 0 } };
  const location = useLocation();
  
  const [expandedSections, setExpandedSections] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarExpandedSections');
      return saved ? JSON.parse(saved) : { main: true, admin: true, account: true };
    } catch {
      return { main: true, admin: true, account: true };
    }
  });
  
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(true);

  // Determine premium & admin status
  const isPremium = userRole === 'premium' || userRole === 'admin';
  const isAdminMode = isAdmin || userRole === 'admin';

  // Reset upgrade prompt when user becomes premium
  useEffect(() => {
    if (isPremium) {
      setShowUpgradePrompt(false);
    } else {
      // Show prompt again for free users (don't use localStorage)
      setShowUpgradePrompt(true);
    }
  }, [isPremium]);

  // Save expanded sections
  useEffect(() => {
    try {
      localStorage.setItem('sidebarExpandedSections', JSON.stringify(expandedSections));
    } catch {}
  }, [expandedSections]);

  // ── Menu Definitions ──────────────────────────────────────────────────

  const userMenuItems = useMemo(() => [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard', exact: true },
    { path: '/builder', icon: FiPlus, label: 'New Resume', highlight: true },
    { path: '/my-resumes', icon: FiFileText, label: 'My Resumes', count: stats?.total || 0 },
    { path: '/templates', icon: FiLayout, label: 'Templates', badge: 'New' },
    { path: '/ats-scanner', icon: FiTarget, label: 'ATS Scanner' },
    { path: '/analytics', icon: FiTrendingUp, label: 'Analytics', premium: true },
    { path: '/cover-letter', icon: FiBriefcase, label: 'Cover Letter', premium: true },
  ], [stats?.total]);

  const adminMenuItems = useMemo(() => [
    {
      section: 'overview',
      label: 'Overview',
      items: [
        { path: '/admin', icon: FiPieChart, label: 'Dashboard', exact: true },
        { path: '/admin/analytics', icon: FiBarChart2, label: 'Analytics' },
        { path: '/admin/activity', icon: FiActivity, label: 'Activity Log' },
      ],
    },
    {
      section: 'management',
      label: 'Management',
      items: [
        { path: '/admin/users', icon: FiUsers, label: 'Users' },
        { path: '/admin/resumes', icon: FiFileText, label: 'Resumes' },
        { path: '/admin/templates', icon: FiLayout, label: 'Templates' },
        { path: '/admin/subscriptions', icon: FiCreditCard, label: 'Subscriptions' },
      ],
    },
    {
      section: 'system',
      label: 'System',
      items: [
        { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
        { path: '/admin/logs', icon: FiTerminal, label: 'System Logs' },
        { path: '/admin/database', icon: FiDatabase, label: 'Database' },
        { path: '/admin/api-keys', icon: FiKey, label: 'API Keys' },
      ],
    },
  ], []);

  const accountItems = useMemo(() => [
    { path: '/profile', icon: FiUser, label: 'Profile' },
    { path: '/settings', icon: FiSettings, label: 'Settings' },
    { path: '/billing', icon: FiCreditCard, label: 'Billing' },
    { path: '/help', icon: FiHelpCircle, label: 'Help & Support' },
  ], []);

  // ── Handlers ───────────────────────────────────────────────────────────

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      onCloseMobile?.();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  }, [logout, onCloseMobile]);

  const handleHideUpgradePrompt = useCallback(() => {
    setShowUpgradePrompt(false);
    // Only hide for this session
  }, []);

  // ── Render Helpers ────────────────────────────────────────────────────

  const isActive = useCallback((path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const renderMenuItem = (item) => {
    const active = isActive(item.path, item.exact);
    const isLocked = item.premium && !isPremium;

    return (
      <Tooltip 
        key={item.path} 
        content={isCollapsed ? item.label : null} 
        position="right"
        disabled={!isCollapsed}
      >
        <NavLink
          to={isLocked ? '/pricing' : item.path}
          onClick={(e) => {
            if (isLocked) {
              e.preventDefault();
              toast('Upgrade to Pro to access this feature', { icon: '⭐' });
              onCloseMobile?.();
            } else {
              onCloseMobile?.();
            }
          }}
          className={({ isActive: navActive }) =>
            `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
              active || navActive
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md'
                : item.highlight
                  ? 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                  : isLocked
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            } ${isCollapsed ? 'justify-center' : ''}`
          }
        >
          <div className="relative flex-shrink-0">
            <item.icon className="w-5 h-5" />
            {isLocked && !active && (
              <FiStar className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" />
            )}
          </div>
          
          {!isCollapsed && (
            <>
              <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {item.badge && <Badge variant="primary" size="sm">{item.badge}</Badge>}
                {item.count !== undefined && item.count > 0 && (
                  <Badge variant="secondary" size="sm">{item.count}</Badge>
                )}
                {isLocked && <FiStar className="w-3 h-3 text-yellow-500" />}
              </div>
            </>
          )}
        </NavLink>
      </Tooltip>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-40
        transition-all duration-300 ease-in-out flex flex-col
        ${isCollapsed && !isMobile ? 'w-20' : 'w-64'}
        ${isMobile ? 'w-64 translate-x-0' : isCollapsed ? '' : ''}
      `}>
        {/* Mobile Close Button */}
        {isMobile && (
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={onCloseMobile}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close sidebar"
            >
              <FiX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}

        {/* Collapse Toggle (Desktop) */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm z-50"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <FiChevronRight className="w-3 h-3" /> : <FiChevronLeft className="w-3 h-3" />}
          </button>
        )}

        {/* Content */}
        <div className="h-full flex flex-col pt-16 overflow-hidden">
          {/* User Profile */}
          {!isCollapsed && user && (
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Avatar 
                  src={user?.photoURL} 
                  name={user?.displayName || user?.email || 'User'} 
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                    {user?.displayName?.split(' ')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {isAdminMode ? (
                      <Badge variant="danger" size="sm">Admin</Badge>
                    ) : isPremium ? (
                      <Badge variant="warning" size="sm">Pro</Badge>
                    ) : (
                      <Badge variant="secondary" size="sm">Free</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              {!isAdminMode && stats && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.total || 0}</p>
                    <p className="text-[10px] text-gray-500">Resumes</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.avgScore || 0}%</p>
                    <p className="text-[10px] text-gray-500">ATS Score</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upgrade Prompt */}
          {!isPremium && !isAdminMode && !isCollapsed && showUpgradePrompt && (
            <div className="px-4 py-3 flex-shrink-0">
              <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <FiAward className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                      Upgrade to Pro
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      Unlimited resumes, AI features & more
                    </p>
                    <NavLink
                      to="/pricing"
                      onClick={onCloseMobile}
                      className="inline-block mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700"
                    >
                      Upgrade Now →
                    </NavLink>
                  </div>
                  <button
                    onClick={handleHideUpgradePrompt}
                    className="text-amber-500 hover:text-amber-600 flex-shrink-0"
                    aria-label="Dismiss upgrade prompt"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-4 overflow-y-auto">
            {isAdminMode ? (
              adminMenuItems.map((section) => (
                <div key={section.section}>
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleSection(section.section)}
                      className="w-full flex items-center justify-between px-3 py-1 mb-1 text-left"
                    >
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {section.label}
                      </span>
                      {expandedSections[section.section] ? (
                        <FiChevronUp className="w-3 h-3 text-gray-400" />
                      ) : (
                        <FiChevronDown className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  )}
                  
                  <AnimatePresence initial={false}>
                    {(isCollapsed || expandedSections[section.section]) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-1 overflow-hidden"
                      >
                        {section.items.map(item => renderMenuItem(item))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            ) : (
              <div className="space-y-1">
                {userMenuItems.map(item => renderMenuItem(item))}
              </div>
            )}

            {/* Account Section */}
            {!isCollapsed && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => toggleSection('account')}
                  className="w-full flex items-center justify-between px-3 py-1 mb-1 text-left"
                >
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Account
                  </span>
                  {expandedSections.account ? (
                    <FiChevronUp className="w-3 h-3 text-gray-400" />
                  ) : (
                    <FiChevronDown className="w-3 h-3 text-gray-400" />
                  )}
                </button>
                
                <AnimatePresence initial={false}>
                  {expandedSections.account && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {accountItems.map(item => renderMenuItem(item))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-700 space-y-3 flex-shrink-0">
            {isPremium && !isAdminMode && !isCollapsed && (
              <div className="px-3 py-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Storage</span>
                  <span className="text-gray-700 dark:text-gray-300">2.4 GB / 10 GB</span>
                </div>
                <Progress value={24} size="sm" />
              </div>
            )}

            {/* Logout */}
            <Tooltip content={isCollapsed ? 'Logout' : null} position="right" disabled={!isCollapsed}>
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

            {!isCollapsed && (
              <p className="text-center text-[10px] text-gray-400">
                v{process.env.REACT_APP_VERSION || '2.5.0'}
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default React.memo(Sidebar);