import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, FiEye, FiDownload, FiTarget,
  FiBarChart2, FiPieChart,
  FiActivity, FiAward, FiClock, FiChevronRight,
  FiRefreshCw, FiFileText, FiAlertCircle,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useResumeContext } from '../contexts/ResumeContext';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: '90days', label: 'Last 90 days' },
];

const CHART_COLORS = {
  primary: 'rgba(99, 102, 241, 0.8)',
  purple: 'rgba(139, 92, 246, 0.8)',
  green: 'rgba(34, 197, 94, 0.8)',
  orange: 'rgba(249, 115, 22, 0.8)',
  pink: 'rgba(236, 72, 153, 0.8)',
};

// ── StatCard Component ────────────────────────────────────────────────────

const StatCard = React.memo(({ icon: Icon, label, value, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }} className="glass-card p-5"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</h3>
        {trend && (
          <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
            <FiTrendingUp className="w-3 h-3" />{trend}
          </p>
        )}
      </div>
      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color}`}>
        <Icon className="w-5 h-5 text-white" />
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
        <div key={i} className="glass-card p-5 h-24">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
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
  useDocumentTitle('Analytics | ResumeAI Pro');

  const { resumes = [], stats: resumeStats, loading: resumesLoading } = useResumeContext();
  const [dateRange, setDateRange] = useState('30days');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Derived Analytics ────────────────────────────────────────────────

  const analytics = useMemo(() => {
    if (!resumes.length) {
      return {
        totalViews: 0,
        totalDownloads: 0,
        avgATSScore: 0,
        improvementRate: 0,
        topResumes: [],
      };
    }

    const totalDownloads = resumes.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
    const scores = resumes.map(r => r.atsScore || 0).filter(s => s > 0);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Top resumes by score
    const topResumes = [...resumes]
      .filter(r => r.atsScore > 0)
      .sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0))
      .slice(0, 3)
      .map(r => ({
        name: r.name || 'Untitled',
        views: r.viewCount || 0,
        downloads: r.downloadCount || 0,
        score: r.atsScore || 0,
      }));

    return {
      totalViews: resumes.reduce((sum, r) => sum + (r.viewCount || 0), 0),
      totalDownloads,
      avgATSScore: avgScore,
      improvementRate: 15, // Placeholder - calculate from historical data
      topResumes,
    };
  }, [resumes]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleRefresh = () => {
    if (loading) return;
    setLoading(true);
    // FIXED: Simulate real refresh
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
      <DashboardLayout title="Analytics" description="Track your resume performance">
        <AnalyticsSkeleton />
      </DashboardLayout>
    );
  }

  // ── Empty State ──────────────────────────────────────────────────────

  if (!resumes.length) {
    return (
      <DashboardLayout title="Analytics" description="Track your resume performance">
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

  return (
    <DashboardLayout title="Analytics" description="Track your resume performance and insights" showWelcome={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Track your resume performance and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={dateRange} onChange={e => setDateRange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
              {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={handleRefresh} loading={loading}>
              <FiRefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FiEye} label="Total Views" value={analytics.totalViews.toLocaleString()} trend="+12%" color="from-blue-500 to-cyan-500" />
          <StatCard icon={FiDownload} label="Total Downloads" value={analytics.totalDownloads.toLocaleString()} trend="+8%" color="from-purple-500 to-pink-500" />
          <StatCard icon={FiTarget} label="Avg ATS Score" value={`${analytics.avgATSScore}%`} trend="+5%" color="from-green-500 to-emerald-500" />
          <StatCard icon={FiTrendingUp} label="Improvement Rate" value={`${analytics.improvementRate}%`} trend="+3%" color="from-orange-500 to-red-500" />
        </div>

        {/* Top Resumes */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiAward className="w-5 h-5 text-yellow-500" /> Top Performing Resumes
          </h3>
          {analytics.topResumes.length > 0 ? (
            <div className="space-y-4">
              {analytics.topResumes.map((resume, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{resume.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><FiEye className="w-3 h-3" />{resume.views}</span>
                        <span className="flex items-center gap-1"><FiDownload className="w-3 h-3" />{resume.downloads}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-500">{resume.score}%</span>
                    <p className="text-xs text-gray-500">ATS Score</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Score your resumes to see top performers</p>
          )}
        </Card>

        {/* Upgrade Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Unlock Advanced Analytics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get detailed insights, competitor analysis, and AI-powered recommendations</p>
              </div>
            </div>
            <Link to="/pricing">
              <Button className="bg-gradient-to-r from-primary-500 to-accent-500">
                Upgrade to Pro <FiChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;