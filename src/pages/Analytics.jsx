// src/pages/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, FiEye, FiDownload, FiTarget,
  FiUsers, FiCalendar, FiBarChart2, FiPieChart,
  FiActivity, FiAward, FiClock, FiChevronRight,
  FiRefreshCw, FiFilter, FiDownload as FiDownloadIcon,
  FiShare2, FiMoreVertical
} from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import useDocumentTitle from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  useDocumentTitle('Analytics - Resume Performance | ResumeAI Pro');
  
  const [dateRange, setDateRange] = useState('30days');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalDownloads: 0,
    avgATSScore: 0,
    improvementRate: 0,
    topPerformingResume: null
  });

  // Sample data - Replace with real data from your backend
  const viewsData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Resume Views',
        data: [45, 52, 38, 61, 55, 72, 68],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Downloads',
        data: [12, 15, 10, 18, 16, 22, 20],
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const atsScoreData = {
    labels: ['Resume 1', 'Resume 2', 'Resume 3', 'Resume 4'],
    datasets: [{
      label: 'ATS Score',
      data: [78, 92, 85, 88],
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(249, 115, 22, 0.8)'
      ]
    }]
  };

  const templateUsageData = {
    labels: ['Modern', 'Classic', 'Creative', 'Minimal', 'Executive'],
    datasets: [{
      data: [35, 25, 20, 12, 8],
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(249, 115, 22, 0.8)'
      ]
    }]
  };

  const recentActivity = [
    { id: 1, action: 'Resume viewed', resume: 'Software Engineer Resume', time: '2 hours ago', views: 12 },
    { id: 2, action: 'Resume downloaded', resume: 'Product Manager Resume', time: '5 hours ago', downloads: 3 },
    { id: 3, action: 'ATS score improved', resume: 'Marketing Director Resume', time: '1 day ago', score: 85 },
    { id: 4, action: 'New resume created', resume: 'UX Designer Resume', time: '2 days ago', status: 'draft' }
  ];

  const topResumes = [
    { name: 'Software Engineer Resume', views: 245, downloads: 67, score: 92 },
    { name: 'Product Manager Resume', views: 189, downloads: 52, score: 88 },
    { name: 'Marketing Director Resume', views: 156, downloads: 41, score: 85 }
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Analytics refreshed');
    }, 1000);
  };

  const handleExport = () => {
    toast.success('Analytics report exported');
  };

  return (
    <DashboardLayout title="Analytics" description="Track your resume performance and insights">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold gradient-text">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your resume performance and ATS optimization progress
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="year">Last year</option>
            </select>
            
            <Button variant="outline" size="sm" onClick={handleRefresh} loading={loading}>
              <FiRefreshCw className="w-4 h-4" />
            </Button>
            
            <Button size="sm" onClick={handleExport}>
              <FiDownloadIcon className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FiEye}
            label="Total Views"
            value="1,247"
            trend="+12%"
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            icon={FiDownload}
            label="Total Downloads"
            value="342"
            trend="+8%"
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            icon={FiTarget}
            label="Avg ATS Score"
            value="86%"
            trend="+5%"
            color="from-green-500 to-emerald-500"
          />
          <StatCard
            icon={FiTrendingUp}
            label="Improvement Rate"
            value="15%"
            trend="+3%"
            color="from-orange-500 to-red-500"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiActivity className="w-5 h-5 text-primary-500" />
              Views & Downloads Trend
            </h3>
            <Line
              data={viewsData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiPieChart className="w-5 h-5 text-purple-500" />
              Template Usage Distribution
            </h3>
            <Doughnut
              data={templateUsageData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' }
                },
                cutout: '60%'
              }}
            />
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiBarChart2 className="w-5 h-5 text-green-500" />
              ATS Score by Resume
            </h3>
            <Bar
              data={atsScoreData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { 
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiAward className="w-5 h-5 text-yellow-500" />
              Top Performing Resumes
            </h3>
            <div className="space-y-4">
              {topResumes.map((resume, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{resume.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiEye className="w-3 h-3" /> {resume.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiDownload className="w-3 h-3" /> {resume.downloads}
                        </span>
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
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiClock className="w-5 h-5 text-blue-500" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  {activity.action === 'Resume viewed' && <FiEye className="w-4 h-4 text-blue-500" />}
                  {activity.action === 'Resume downloaded' && <FiDownload className="w-4 h-4 text-green-500" />}
                  {activity.action === 'ATS score improved' && <FiTrendingUp className="w-4 h-4 text-orange-500" />}
                  {activity.action === 'New resume created' && <FiFileText className="w-4 h-4 text-purple-500" />}
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.resume}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{activity.time}</p>
                  {activity.views && <p className="text-xs text-blue-500">{activity.views} views</p>}
                  {activity.downloads && <p className="text-xs text-green-500">{activity.downloads} downloads</p>}
                  {activity.score && <p className="text-xs text-orange-500">{activity.score}% score</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upgrade Banner */}
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
            <Button className="bg-gradient-to-r from-primary-500 to-accent-500">
              Upgrade to Pro
              <FiChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
    className="glass-card p-5"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
        {trend && (
          <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
            <FiTrendingUp className="w-3 h-3" />
            {trend}
          </p>
        )}
      </div>
      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </motion.div>
);

// FiFileText icon component
const FiFileText = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default Analytics;