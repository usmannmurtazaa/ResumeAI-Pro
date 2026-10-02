import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiFileText,
  FiAward,
  FiClock,
  FiTarget,
  FiCheckCircle,
  FiArrowRight,
  FiPlus,
  FiInfo,
  FiBell,
  FiX,
  FiChevronRight,
  FiBarChart2,
  FiDownload,
  FiCalendar,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useResume } from '../contexts/ResumeContext';
import { useNotifications } from '../contexts/NotificationContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import DashboardLayout from '../components/layouts/DashboardLayout';
import AdminLayout from '../components/layouts/AdminLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import Modal from '../components/ui/Modal';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const FREE_RESUME_LIMIT = 5;

const QUICK_ACTIONS = [
  {
    id: 'new-resume',
    icon: FiPlus,
    label: 'New Resume',
    color: 'from-blue-500 to-cyan-500',
    path: '/builder',
  },
  {
    id: 'ats-scanner',
    icon: FiTarget,
    label: 'ATS Scanner',
    color: 'from-purple-500 to-pink-500',
    path: '/ats-scanner',
  },
  {
    id: 'templates',
    icon: FiFileText,
    label: 'Templates',
    color: 'from-green-500 to-emerald-500',
    path: '/templates',
  },
  {
    id: 'analytics',
    icon: FiBarChart2,
    label: 'Analytics',
    color: 'from-orange-500 to-red-500',
    path: '/analytics',
  },
];

const KEYBOARD_SHORTCUTS = [
  { keys: '⌘K', description: 'Search' },
  { keys: '⌘N', description: 'New Resume' },
  { keys: '⌘D', description: 'Dashboard' },
  { keys: '⌘,', description: 'Settings' },
];

// ── StatCard Component ────────────────────────────────────────────────────

const StatCard = React.memo(({ icon: Icon, label, value, color, onClick }) => (
  <motion.div
    whileHover={onClick ? { scale: 1.02 } : undefined}
    onClick={onClick}
    className={cn(
      'glass-card p-4 sm:p-5',
      onClick && 'cursor-pointer hover:shadow-lg transition-all'
    )}
  >
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold mt-1 text-gray-900 dark:text-white truncate">
          {value}
        </p>
      </div>
      <div className={cn('p-3 rounded-xl bg-gradient-to-br', color)}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    </div>
  </motion.div>
));

StatCard.displayName = 'StatCard';

// ── QuickActionCard ──────────────────────────────────────────────────────

const QuickActionCard = React.memo(({ icon: Icon, label, color, onClick, description }) => (
  <motion.button
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="glass-card p-4 text-left hover:shadow-lg transition-all group"
  >
    <div className="flex items-center gap-3">
      <div className={cn('p-3 rounded-xl bg-gradient-to-br', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white text-sm">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
        )}
      </div>
      <FiArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
    </div>
  </motion.button>
));

QuickActionCard.displayName = 'QuickActionCard';

// ── ResumeCardCompact ────────────────────────────────────────────────────

const ResumeCardCompact = React.memo(({ resume, onClick }) => {
  const score = resume.atsScore || 0;
  const updatedAt =
    resume.updatedAt?.toDate?.() || (resume.updatedAt ? new Date(resume.updatedAt) : new Date());
  const timeAgo = (() => {
    const diff = Date.now() - updatedAt.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return updatedAt.toLocaleDateString();
  })();

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="cursor-pointer p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate text-gray-900 dark:text-white">
            {resume.name || 'Untitled'}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {resume.data?.personal?.fullName || 'No name'}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <FiCalendar className="w-3 h-3" />
              {timeAgo}
            </span>
            <span className="flex items-center gap-1">
              <FiDownload className="w-3 h-3" />
              {resume.downloadCount || 0}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'secondary'}
            size="sm"
          >
            {score}%
          </Badge>
          <FiChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </motion.div>
  );
});

ResumeCardCompact.displayName = 'ResumeCardCompact';

// ── Main Component ────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user, userRole, loading, isPremium } = useAuth();
  const { stats = {}, resumes = [], createResume } = useResume();
  const { unreadCount = 0 } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // FIX 5: Tracks which template is being created from the welcome modal.
  // `null` means no creation is in flight. While non-null, all template
  // buttons and the "Maybe Later" button are disabled, so a double-tap
  // cannot fire two `createResume` calls before the modal closes.
  const [creatingTemplate, setCreatingTemplate] = useState(null);

  // ── Welcome message from signup ─────────────────────────────────────

  useEffect(() => {
    if (location.state?.welcome) {
      setShowWelcomeModal(true);
      toast.success("Welcome! Let's create your first resume.", { icon: '🎉', duration: 5000 });
    }
  }, [location.state]);

  // ── Free limit warning ──────────────────────────────────────────────

  useEffect(() => {
    if (!isPremium && stats?.total >= FREE_RESUME_LIMIT - 1) {
      setShowLimitWarning(true);
    }
  }, [isPremium, stats?.total]);

  // ── Derived data ────────────────────────────────────────────────────

  const resumesUsed = stats?.total || 0;
  const resumesRemaining = isPremium ? Infinity : Math.max(0, FREE_RESUME_LIMIT - resumesUsed);
  const limitPercentage = isPremium ? 0 : Math.min((resumesUsed / FREE_RESUME_LIMIT) * 100, 100);

  const recentResumes = useMemo(() => {
    return resumes.slice(0, 3);
  }, [resumes]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleCreateResume = useCallback(async () => {
    try {
      const newResume = await createResume({ name: 'Untitled Resume' });
      if (newResume?.id) navigate(`/builder/${newResume.id}`);
    } catch {
      // Error handled in context
    }
  }, [createResume, navigate]);

  const handleQuickAction = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  const handleUpgrade = useCallback(() => navigate('/pricing'), [navigate]);

  // FIX 5: Welcome modal handler with single-flight guard.
  const handleCreateFromWelcome = useCallback(
    async (template) => {
      if (creatingTemplate !== null) return;
      setCreatingTemplate(template);
      try {
        const newResume = await createResume({
          template,
          name: `${template.charAt(0).toUpperCase() + template.slice(1)} Resume`,
        });
        if (newResume?.id) {
          setShowWelcomeModal(false);
          navigate(`/builder/${newResume.id}`);
        }
      } catch {
        // Error handled in context
      } finally {
        setCreatingTemplate(null);
      }
    },
    [creatingTemplate, createResume, navigate]
  );

  // ── Loading State ────────────────────────────────────────────────────
  //
  // FIX 4: Rendered without any layout wrapper. The previous version
  // committed to `DashboardLayout` while auth was still initializing;
  // when the user turned out to be an admin, the shell flipped to
  // `AdminLayout`, producing a visible layout flash. The loading state
  // now renders a plain centered spinner with no shell, so whichever
  // layout mounts after loading is the first one the user sees.
  //
  // The previous `DashboardSkeleton` component (and the `SkeletonCard`
  // import it relied on) is removed as dead code — it is no longer
  // rendered anywhere in this file.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader variant="brand" size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  // ── Admin View ───────────────────────────────────────────────────────
  //
  // FIX 3: `title` and `description` props removed. `AdminDashboard`
  // already renders its own `<h1>Admin Dashboard</h1>` and a "Last
  // updated" line, so passing them here produced two headings stacked
  // on top of each other on every admin page load.

  if (userRole === 'admin') {
    return (
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    );
  }

  // ── User View ────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Dashboard" description="Manage your resumes" showWelcome={false}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">
                    {greeting}, {user?.displayName?.split(' ')[0] || 'there'}!
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{user?.email}</span>
                    {isPremium && (
                      <Badge variant="warning" size="sm" className="ml-1">
                        <FiAward className="w-3 h-3 mr-1" />
                        PRO
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Resume Limit (Free Users) */}
              {!isPremium && (
                <div className="mt-3 max-w-xs">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Resume Limit</span>
                    <span className="font-medium">
                      {resumesUsed} / {FREE_RESUME_LIMIT}
                    </span>
                  </div>
                  <Progress
                    value={limitPercentage}
                    size="sm"
                    color={limitPercentage >= 80 ? 'warning' : 'primary'}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
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

        {/* Limit Warning */}
        <AnimatePresence>
          {showLimitWarning && !isPremium && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              // FIX 1: The previous flex container placed a ~177px text
              // block next to a ~112px button group with a 16px gap; at
              // 320px viewport width that overflowed by ~50px and pushed
              // the close button off-screen. Adding `flex-wrap` lets the
              // button group drop onto its own line when space runs out,
              // `min-w-0` on the text wrapper lets the text column shrink
              // below its content width, and `flex-shrink-0` on the button
              // group keeps the controls from being squeezed.
              className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-3 sm:gap-4"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>
                      {resumesRemaining === Infinity ? 'Unlimited' : resumesRemaining}
                    </strong>{' '}
                    free resume
                    {resumesRemaining !== 1 && resumesRemaining !== Infinity ? 's' : ''} remaining.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button size="sm" variant="primary" onClick={handleUpgrade}>
                  Upgrade
                </Button>
                <button
                  onClick={() => setShowLimitWarning(false)}
                  className="text-blue-500 hover:text-blue-600 p-1"
                  aria-label="Dismiss"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FiFileText}
            label="Total Resumes"
            value={stats?.total || 0}
            color="from-blue-500 to-cyan-500"
            onClick={() => navigate('/my-resumes')}
          />
          <StatCard
            icon={FiCheckCircle}
            label="Completed"
            value={stats?.completed || 0}
            color="from-green-500 to-emerald-500"
            onClick={() => navigate('/my-resumes?status=completed')}
          />
          <StatCard
            icon={FiTarget}
            label="Avg ATS Score"
            value={`${stats?.avgScore || 0}%`}
            color="from-purple-500 to-pink-500"
            onClick={() => navigate('/analytics')}
          />
          <StatCard
            icon={FiBell}
            label="Notifications"
            value={unreadCount}
            color="from-orange-500 to-red-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard
              key={action.id}
              icon={action.icon}
              label={action.label}
              color={action.color}
              onClick={() => handleQuickAction(action.path)}
              description={action.id === 'new-resume' ? 'Start from scratch' : ''}
            />
          ))}
        </div>

        {/* Recent Resumes */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FiClock className="w-5 h-5 text-primary-500" />
              Recent Resumes
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-resumes')}>
              View All <FiArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {recentResumes.length > 0 ? (
            <div className="space-y-2">
              {recentResumes.map((resume) => (
                <ResumeCardCompact
                  key={resume.id}
                  resume={resume}
                  onClick={() => navigate(`/builder/${resume.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No resumes yet</p>
              <Button variant="outline" size="sm" onClick={handleCreateResume} className="mt-3">
                Create Your First Resume
              </Button>
            </div>
          )}
        </Card>

        {/* Upgrade Banner (Free Users) */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiAward className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                    Upgrade to Pro
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Unlimited resumes, AI suggestions, premium templates, and more.
                  </p>
                </div>
              </div>
              <Button onClick={handleUpgrade} variant="warning" size="sm" icon={<FiArrowRight />}>
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
          <span className="inline-flex items-center gap-3 flex-wrap justify-center">
            {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
              <span key={i} className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-[10px]">
                  {shortcut.keys}
                </kbd>
                <span>{shortcut.description}</span>
                {i < KEYBOARD_SHORTCUTS.length - 1 && (
                  <span className="text-gray-300 dark:text-gray-600 mx-0.5">•</span>
                )}
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* Welcome Modal */}
      <Modal
        isOpen={showWelcomeModal}
        onClose={() => {
          // Do not allow closing while a creation is in flight; the modal
          // must stay open so the user sees the result and, on failure,
          // can retry.
          if (creatingTemplate !== null) return;
          setShowWelcomeModal(false);
        }}
        title="Welcome to Maniesta Career OS!"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Let's get you started with your first professional resume. Choose a template to begin.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {['modern', 'classic', 'creative', 'tech'].map((template) => {
              const isThisCreating = creatingTemplate === template;
              const isAnyCreating = creatingTemplate !== null;
              return (
                <button
                  key={template}
                  onClick={() => handleCreateFromWelcome(template)}
                  // FIX 5: All buttons disabled while any creation is in
                  // flight. Prevents a double-tap from firing two
                  // `createResume` calls before the modal closes.
                  disabled={isAnyCreating}
                  className={cn(
                    'p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-left transition-all',
                    !isAnyCreating && 'hover:border-primary-300',
                    isAnyCreating && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <p className="font-medium capitalize flex items-center gap-2">
                    {isThisCreating ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Creating…</span>
                      </>
                    ) : (
                      template
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Start with {template} template</p>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowWelcomeModal(false)}
              disabled={creatingTemplate !== null}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Dashboard;
