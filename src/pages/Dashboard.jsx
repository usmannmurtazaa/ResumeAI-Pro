import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiUser, 
  FiUsers, 
  FiFileText, 
  FiActivity,
  FiAward,
  FiTrendingUp,
  FiCalendar,
  FiClock,
  FiTarget,
  FiBarChart2,
  FiZap,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiArrowRight,
  FiPlus,
  FiEye,
  FiDownload,
  FiStar
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
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
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, userRole, loading, userData, isPremium, subscription } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [greeting, setGreeting] = useState('');
  const [quickStats, setQuickStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      toast.success('Welcome to ResumeAi Pro! Let\'s create your first resume.', {
        icon: '🎉',
        duration: 5000
      });
    }
  }, [location.state]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };

  const handleCreateResume = () => {
    navigate('/builder');
  };

  const handleViewAllResumes = () => {
    navigate('/dashboard/resumes');
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-96" />
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
          
          {/* Content Skeleton */}
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
    <DashboardLayout 
      title="Dashboard" 
      description="Manage your resumes and track your progress"
      showWelcome={false}
    >
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
                        <FiAward className="w-3 h-3 mr-1" />
                        PRO Member
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Tooltip content="Refresh data">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  loading={isRefreshing}
                  icon={<FiRefreshCw />}
                >
                  Refresh
                </Button>
              </Tooltip>
              <Button
                onClick={handleCreateResume}
                icon={<FiPlus />}
                className="bg-gradient-to-r from-primary-500 to-accent-500"
              >
                Create New Resume
              </Button>
            </div>
          </div>
        </motion.div>

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
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                    Upgrade to Pro
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Get unlimited resumes, AI suggestions, and premium templates
                  </p>
                </div>
              </div>
              <Button
                onClick={handleUpgrade}
                variant="warning"
                size="sm"
                icon={<FiArrowRight />}
              >
                Upgrade Now
              </Button>
            </div>
          </motion.div>
        )}

        {/* Main Dashboard Content */}
        <UserDashboard />

        {/* Quick Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FiZap className="w-5 h-5 text-yellow-500" />
              Quick Tips for ATS Success
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TipCard
                icon={FiTarget}
                title="Use Keywords"
                description="Include industry-specific keywords from the job description"
                color="text-blue-500"
              />
              <TipCard
                icon={FiStar}
                title="Quantify Results"
                description="Use numbers and percentages to demonstrate your impact"
                color="text-green-500"
              />
              <TipCard
                icon={FiFileText}
                title="Keep it Simple"
                description="Avoid complex formatting, tables, or graphics"
                color="text-purple-500"
              />
            </div>
          </Card>
        </motion.div>

        {/* Keyboard Shortcuts Hint */}
        <div className="text-center text-xs text-gray-400">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">⌘K</kbd> to search • 
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded ml-1">⌘N</kbd> new resume • 
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded ml-1">?</kbd> view all shortcuts
        </div>
      </div>
    </DashboardLayout>
  );
};

// Quick Tip Card Component
const TipCard = ({ icon: Icon, title, description, color }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
    <div className={`p-2 rounded-lg bg-${color.split('-')[1]}-100 dark:bg-${color.split('-')[1]}-900/30`}>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <div>
      <h4 className="font-medium text-sm mb-0.5">{title}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  </div>
);

export default Dashboard;