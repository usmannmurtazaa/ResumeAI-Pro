import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiUser, FiUsers, FiFileText, FiActivity, FiAward, FiTrendingUp,
  FiCalendar, FiClock, FiTarget, FiBarChart2, FiZap, FiAlertCircle,
  FiCheckCircle, FiRefreshCw, FiArrowRight, FiPlus, FiEye, FiDownload,
  FiStar, FiEdit, FiTrash2, FiCopy, FiInfo,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useResume } from '../contexts/ResumeContext';
import { useNotifications } from '../contexts/NotificationContext';
import UserDashboard from '../components/dashboard/UserDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import Loader from '../components/common/Loader';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import Tooltip from '../components/ui/Tooltip';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

// ============================================
// DASHBOARD PAGE COMPONENT
// ============================================

const Dashboard = () => {
  const { user, userRole, loading, userData, isPremium, subscription } = useAuth();
  const { stats, resumes, recentResumes, createResume } = useResume();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [greeting, setGreeting] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Check for welcome message from signup
  useEffect(() => {
    if (location.state?.welcome) {
      setShowWelcomeModal(true);
      toast.success('Welcome to ResumeAI Pro! Let\'s create your first resume.', {
        icon: '🎉',
        duration: 5000,
      });
    }
  }, [location.state]);

  // Check free limit warning
  useEffect(() => {
    if (!isPremium && stats?.total >= 4 && stats?.total < 5) {
      setShowLimitWarning(true);
    }
  }, [isPremium, stats?.total]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    window.location.reload();
  };

  const handleCreateResume = async () => {
    try {
      const newResume = await createResume({ name: 'Untitled Resume' });
      navigate(`/builder/${newResume.id}`);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleQuickCreate = useCallback(async (template) => {
    try {
      const newResume = await createResume({ template, name: `${template.charAt(0).toUpperCase() + template.slice(1)} Resume` });
      navigate(`/builder/${newResume.id}`);
    } catch (error) {
      // Error handled in context
    }
  }, [createResume, navigate]);

  const handleUpgrade = () => navigate('/pricing');
  const handleViewAllResumes = () => navigate('/dashboard/resumes');
  const handleViewNotifications = () => navigate('/notifications');

  // Free resume limit info
  const FREE_LIMIT = 5;
  const resumesUsed = stats?.total || 0;
  const resumesRemaining = isPremium ? Infinity : Math.max(0, FREE_LIMIT - resumesUsed);
  const limitPercentage = isPremium ? 0 : (resumesUsed / FREE_LIMIT) * 100;

  // Loading state with skeleton
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-96" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  // Admin Dashboard
  if (userRole === 'admin') {
    return (
      <AdminLayout title="Admin Dashboard" description="Manage users, resumes, and platform settings">
        <AdminDashboard />
      </AdminLayout>
    );
  }

  // User Dashboard
  return (
    <DashboardLayout title="Dashboard" description="Manage your resumes and track your progress" showWelcome={false}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-semibold">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">
                    {greeting}, {user?.displayName?.split(' ')[0] || 'there'}! 👋
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {user?.email}
                    {isPremium && (
                      <Badge variant="warning" size="sm" className="ml-2">
                        <FiAward className="w-3 h-3 mr-1" /> PRO Member
                      </Badge>
                    )}
                  </p>
                </div>
              </div>

              {/* Resume Limit Progress (Free Users) */}
              {!isPremium && (
                <div className="mt-3 max-w-xs">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Resume Limit</span>
                    <span className="font-medium">
                      {resumesUsed} / {FREE_LIMIT} used
                    </span>
                  </div>
                  <Progress value={limitPercentage} size="sm" color={limitPercentage >= 80 ? 'warning' : 'primary'} />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Tooltip content="Refresh data">
                <Button variant="outline" size="sm" onClick={handleRefresh} loading={isRefreshing} icon={<FiRefreshCw />}>
                  Refresh
                </Button>
              </Tooltip>
              <Button onClick={handleCreateResume} icon={<FiPlus />} className="bg-gradient-to-r from-primary-500 to-accent-500">
                Create New Resume
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={FiFileText} label="Total Resumes" value={stats?.total || 0} color="bg-blue-500" />
          <StatCard icon={FiCheckCircle} label="Completed" value={stats?.completed || 0} color="bg-green-500" />
          <StatCard icon={FiTarget} label="Avg ATS Score" value={`${stats?.avgScore || 0}%`} color="bg-purple-500" />
          <StatCard icon={FiBell} label="Notifications" value={unreadCount} color="bg-orange-500" onClick={handleViewNotifications} clickable />
        </div>

        {/* Limit Warning for Free Users */}
        <AnimatePresence>
          {showLimitWarning && !isPremium && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-3">
                <FiInfo className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You have <strong>{resumesRemaining}</strong> free resume{resumesRemaining !== 1 ? 's' : ''} remaining.
                    Upgrade to Pro for unlimited resumes!
                  </p>
                </div>
                <Button size="sm" variant="primary" onClick={handleUpgrade}>Upgrade</Button>
                <button onClick={() => setShowLimitWarning(false)} className="text-blue-500 hover:text-blue-600">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upgrade Banner for Free Users */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <FiAward className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300">Upgrade to Pro</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Get unlimited resumes, AI suggestions, and premium templates
                  </p>
                </div>
              </div>
              <Button onClick={handleUpgrade} variant="warning" size="sm" icon={<FiArrowRight />}>
                Upgrade Now
              </Button>
            </div>
          </motion.div>
        )}

        {/* Recent Resumes Quick Access */}
        {resumes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FiClock className="w-5 h-5 text-primary-500" />
                  Recent Resumes
                </h3>
                <Button variant="ghost" size="sm" onClick={handleViewAllResumes}>
                  View All <FiArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {resumes.slice(0, 3).map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/builder/${resume.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30">
                        <FiFileText className="w-4 h-4 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{resume.name || 'Untitled'}</p>
                        <p className="text-xs text-gray-500">
                          Updated {new Date(resume.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={resume.atsScore >= 80 ? 'success' : resume.atsScore >= 60 ? 'warning' : 'secondary'} size="sm">
                        {resume.atsScore || 0}%
                      </Badge>
                      <FiChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Main Dashboard Content */}
        <UserDashboard />

        {/* Quick Tips Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FiZap className="w-5 h-5 text-yellow-500" />
              Quick Tips for ATS Success
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TipCard icon={FiTarget} title="Use Keywords" description="Include industry-specific keywords from the job description" color="text-blue-500" />
              <TipCard icon={FiStar} title="Quantify Results" description="Use numbers and percentages to demonstrate your impact" color="text-green-500" />
              <TipCard icon={FiFileText} title="Keep it Simple" description="Avoid complex formatting, tables, or graphics" color="text-purple-500" />
            </div>
          </Card>
        </motion.div>

        {/* Keyboard Shortcuts Hint */}
        <div className="text-center text-xs text-gray-400">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">⌘K</kbd> to search •
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded ml-1">⌘N</kbd> new resume •
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded ml-1">⌘D</kbd> dashboard •
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded ml-1">?</kbd> view all shortcuts
        </div>
      </div>

      {/* Welcome Modal for New Users */}
      <Modal isOpen={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} title="Welcome to ResumeAI Pro! 🎉" size="md">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            We're excited to have you on board! Let's get you started with your first professional resume.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {['modern', 'classic', 'creative', 'minimal'].map((template) => (
              <button
                key={template}
                onClick={() => { setShowWelcomeModal(false); handleQuickCreate(template); }}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all text-left"
              >
                <p className="font-medium capitalize">{template}</p>
                <p className="text-xs text-gray-500">Start with {template} template</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setShowWelcomeModal(false)}>Maybe Later</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

// ============================================
// STAT CARD COMPONENT
// ============================================

const StatCard = ({ icon: Icon, label, value, color, onClick, clickable }) => (
  <motion.div
    whileHover={clickable ? { scale: 1.02 } : {}}
    onClick={onClick}
    className={clsx('glass-card p-4', clickable && 'cursor-pointer')}
  >
    <div className="flex items-center gap-3">
      <div className={clsx('p-3 rounded-xl', color, 'bg-opacity-20')}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </motion.div>
);

// ============================================
// QUICK TIP CARD COMPONENT
// ============================================

const TipCard = ({ icon: Icon, title, description, color }) => {
  const colorMap = {
    'text-blue-500': 'bg-blue-100 dark:bg-blue-900/30',
    'text-green-500': 'bg-green-100 dark:bg-green-900/30',
    'text-purple-500': 'bg-purple-100 dark:bg-purple-900/30',
    'text-yellow-500': 'bg-yellow-100 dark:bg-yellow-900/30',
    'text-red-500': 'bg-red-100 dark:bg-red-900/30',
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div className={clsx('p-2 rounded-lg', colorMap[color] || 'bg-gray-100 dark:bg-gray-700')}>
        <Icon className={clsx('w-4 h-4', color)} />
      </div>
      <div>
        <h4 className="font-medium text-sm mb-0.5">{title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
};

// Missing imports
const FiBell = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const FiX = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FiChevronRight = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const clsx = (...args) => args.filter(Boolean).join(' ');

export default Dashboard;