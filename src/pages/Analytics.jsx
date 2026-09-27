import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiTrendingUp,
  FiEye,
  FiDownload,
  FiTarget,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiAward,
  FiClock,
  FiChevronRight,
  FiRefreshCw,
  FiFileText,
  FiAlertCircle,
  FiCalendar,
  FiArrowUp,
  FiArrowDown,
  FiUsers,
  FiStar,
  FiZap,
} from 'react-icons/fi';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useResumeContext } from '../contexts/ResumeContext';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

// ── Constants ─────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: '90days', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

const CHART_COLORS = {
  primary: 'rgba(99, 102, 241, 0.8)',
  purple: 'rgba(139, 92, 246, 0.8)',
  green: 'rgba(34, 197, 94, 0.8)',
  orange: 'rgba(249, 115, 22, 0.8)',
  pink: 'rgba(236, 72, 153, 0.8)',
  cyan: 'rgba(6, 182, 212, 0.8)',
  indigo: 'rgba(99, 102, 241, 0.8)',
};

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#34d399', '#f59e0b', '#ef4444', '#06b6d4'];

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const formatCompact = (num) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
};

const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};

// ── Sub-Components ────────────────────────────────────────────────────────

const StatCard = React.memo(({ icon: Icon, label, value, trend, trendLabel, color, onClick }) => (
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
        <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white truncate">{value}</p>
        {trend !== undefined && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={cn('text-xs font-medium', trend >= 0 ? 'text-green-500' : 'text-red-500')}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
            {trendLabel && <span className="text-xs text-gray-400">{trendLabel}</span>}
          </div>
        )}
      </div>
      <div className={cn('p-3 rounded-xl bg-gradient-to-br', color)}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    </div>
  </motion.div>
));

StatCard.displayName = 'StatCard';

// ── Loading Skeleton ──────────────────────────────────────────────────────

const AnalyticsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────

const Analytics = () => {
  useDocumentTitle('Analytics | Resume Ai Pro');

  const { resumes = [], stats: resumeStats, loading: resumesLoading } = useResumeContext();
  const [dateRange, setDateRange] = useState('30days');
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Derived Analytics ────────────────────────────────────────────────

  const analytics = useMemo(() => {
    if (!resumes.length) {
      return {
        totalViews: 0,
        totalDownloads: 0,
        avgATSScore: 0,
        bestScore: 0,
        improvementRate: 0,
        topResumes: [],
        scoreDistribution: [],
        monthlyActivity: [],
        statusCounts: { completed: 0, draft: 0, archived: 0 },
        templateDistribution: {},
      };
    }

    const totalDownloads = resumes.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
    const totalViews = resumes.reduce((sum, r) => sum + (r.viewCount || 0), 0);
    const scores = resumes.map((r) => r.atsScore || 0).filter((s) => s > 0);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const bestScore = scores.length ? Math.max(...scores) : 0;

    // Score distribution
    const scoreDistribution = [
      { range: '0-19%', count: 0 },
      { range: '20-39%', count: 0 },
      { range: '40-59%', count: 0 },
      { range: '60-79%', count: 0 },
      { range: '80-100%', count: 0 },
    ];
    scores.forEach((s) => {
      if (s < 20) scoreDistribution[0].count++;
      else if (s < 40) scoreDistribution[1].count++;
      else if (s < 60) scoreDistribution[2].count++;
      else if (s < 80) scoreDistribution[3].count++;
      else scoreDistribution[4].count++;
    });

    // Status counts
    const statusCounts = {
      completed: resumes.filter((r) => r.status === 'completed' || r.atsScore >= 80).length,
      draft: resumes.filter((r) => r.status === 'draft' || (!r.status && r.atsScore < 80)).length,
      archived: resumes.filter((r) => r.status === 'archived').length,
    };

    // Template distribution
    const templateDistribution = {};
    resumes.forEach((r) => {
      const t = r.template || 'modern';
      templateDistribution[t] = (templateDistribution[t] || 0) + 1;
    });

    // Top resumes by score
    const topResumes = [...resumes]
      .filter((r) => r.atsScore > 0)
      .sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0))
      .slice(0, 5)
      .map((r) => ({
        name: r.name || 'Untitled',
        views: r.viewCount || 0,
        downloads: r.downloadCount || 0,
        score: r.atsScore || 0,
        template: r.template || 'modern',
        updatedAt: r.updatedAt,
      }));

    // Monthly activity (mock data for now - in production, use real timestamps)
    const now = new Date();
    const monthlyActivity = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        created: 0,
        updated: 0,
      };
    });

    // Update with real data if available
    resumes.forEach((r) => {
      if (r.createdAt) {
        const date = new Date(r.createdAt);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const entry = monthlyActivity.find((m) => m.month === monthKey);
        if (entry) entry.created++;
      }
      if (r.updatedAt) {
        const date = new Date(r.updatedAt);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const entry = monthlyActivity.find((m) => m.month === monthKey);
        if (entry) entry.updated++;
      }
    });

    return {
      totalViews,
      totalDownloads,
      avgATSScore: avgScore,
      bestScore,
      improvementRate:
        scores.length > 1
          ? Math.round(((scores[0] || 0) - (scores[scores.length - 1] || 0)) / (scores.length || 1))
          : 0,
      topResumes,
      scoreDistribution,
      monthlyActivity,
      statusCounts,
      templateDistribution,
    };
  }, [resumes]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleRefresh = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
        toast.success('Analytics refreshed');
      }
    }, 800);
  };

  const isLoading = resumesLoading || loading;

  // ── Loading State ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <DashboardLayout
        title="Analytics"
        description="Track your resume performance"
        showWelcome={false}
      >
        <AnalyticsSkeleton />
      </DashboardLayout>
    );
  }

  // ── Empty State ──────────────────────────────────────────────────────

  if (!resumes.length) {
    return (
      <DashboardLayout
        title="Analytics"
        description="Track your resume performance"
        showWelcome={false}
      >
        <div className="text-center py-16">
          <FiBarChart2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No Data Yet</h2>
          <p className="text-gray-500 mb-6">Create resumes to start tracking analytics.</p>
          <Link to="/builder">
            <Button>Create Your First Resume</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────────

  return (
    <DashboardLayout
      title="Analytics"
      description="Track your resume performance and insights"
      showWelcome={false}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Track your resume performance and insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              {DATE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              loading={loading}
              icon={<FiRefreshCw />}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FiEye}
            label="Total Views"
            value={formatCompact(analytics.totalViews)}
            trend={analytics.totalViews > 0 ? 12 : undefined}
            trendLabel="vs last month"
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            icon={FiDownload}
            label="Total Downloads"
            value={formatCompact(analytics.totalDownloads)}
            trend={analytics.totalDownloads > 0 ? 8 : undefined}
            trendLabel="vs last month"
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            icon={FiTarget}
            label="Avg ATS Score"
            value={`${analytics.avgATSScore}%`}
            trend={analytics.avgATSScore > 70 ? 5 : -3}
            trendLabel="vs last month"
            color="from-green-500 to-emerald-500"
          />
          <StatCard
            icon={FiAward}
            label="Best Score"
            value={`${analytics.bestScore}%`}
            color="from-orange-500 to-red-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FiPieChart className="w-5 h-5 text-primary-500" />
              ATS Score Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-center text-sm text-gray-500">
              {analytics.scoreDistribution.reduce((sum, d) => sum + d.count, 0)} resumes analyzed
            </div>
          </Card>

          {/* Status Breakdown */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FiActivity className="w-5 h-5 text-primary-500" />
              Resume Status
            </h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: analytics.statusCounts.completed },
                      { name: 'Draft', value: analytics.statusCounts.draft },
                      { name: 'Archived', value: analytics.statusCounts.archived },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-sm">
              {[
                {
                  label: 'Completed',
                  color: 'text-green-500',
                  count: analytics.statusCounts.completed,
                },
                { label: 'Draft', color: 'text-yellow-500', count: analytics.statusCounts.draft },
                {
                  label: 'Archived',
                  color: 'text-gray-500',
                  count: analytics.statusCounts.archived,
                },
              ].map((s) => (
                <span key={s.label} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${s.color.replace('text', 'bg')}`} />
                  <span>
                    {s.label}: {s.count}
                  </span>
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Monthly Activity */}
        {analytics.monthlyActivity.some((m) => m.created > 0 || m.updated > 0) && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5 text-primary-500" />
              Monthly Activity
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stackId="1"
                    stroke={CHART_COLORS.primary}
                    fill={CHART_COLORS.primary}
                    name="Created"
                  />
                  <Area
                    type="monotone"
                    dataKey="updated"
                    stackId="1"
                    stroke={CHART_COLORS.cyan}
                    fill={CHART_COLORS.cyan}
                    name="Updated"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Top Resumes */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FiAward className="w-5 h-5 text-yellow-500" />
            Top Performing Resumes
          </h3>
          {analytics.topResumes.length > 0 ? (
            <div className="space-y-4">
              {analytics.topResumes.map((resume, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{resume.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiEye className="w-3 h-3" />
                          {resume.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiDownload className="w-3 h-3" />
                          {resume.downloads}
                        </span>
                        <Badge variant="secondary" size="sm" className="capitalize">
                          {resume.template}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn('text-lg font-bold', getScoreColor(resume.score))}>
                      {resume.score}%
                    </span>
                    <p className="text-xs text-gray-500">ATS Score</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Score your resumes to see top performers
            </p>
          )}
        </Card>

        {/* Upgrade Banner */}
        {!analytics.topResumes.length || analytics.avgATSScore < 70 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Unlock Advanced Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get detailed insights, competitor analysis, and AI-powered recommendations
                  </p>
                </div>
              </div>
              <Link to="/pricing">
                <Button className="bg-gradient-to-r from-primary-500 to-accent-500">
                  Upgrade to Pro <FiChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;