import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  FiUsers, 
  FiFileText, 
  FiActivity, 
  FiTrendingUp,
  FiTrendingDown,
  FiSearch, 
  FiTrash2, 
  FiUserX,
  FiUserCheck,
  FiEdit2,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiMoreVertical,
  FiEye,
  FiShield,
  FiAward,
  FiCalendar,
  FiPieChart,
  FiBarChart2,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiMail,
  FiSmartphone,
  FiGlobe,
  FiChevronLeft,
  FiChevronRight,
  FiSettings
} from 'react-icons/fi';
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
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Progress from '../ui/Progress';
import Input from '../ui/Input';
import toast from 'react-hot-toast';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

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

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalResumes: 0,
    activeUsers: 0,
    premiumUsers: 0,
    suspendedUsers: 0,
    newUsersToday: 0,
    newResumesToday: 0,
    conversionRate: 0
  });
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [chartData, setChartData] = useState({
    daily: { labels: [], datasets: [] },
    templates: { labels: [], datasets: [] },
    userGrowth: { labels: [], datasets: [] },
    activityHeatmap: { labels: [], datasets: [] }
  });
  const [dateRange, setDateRange] = useState('7days');
  const [exportLoading, setExportLoading] = useState(false);

  // Real-time updates
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      updateStats(usersData, resumes);
    });

    const unsubscribeResumes = onSnapshot(collection(db, 'resumes'), (snapshot) => {
      const resumesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setResumes(resumesData);
      updateStats(users, resumesData);
    });

    setLoading(false);

    return () => {
      unsubscribeUsers();
      unsubscribeResumes();
    };
  }, []);

  const updateStats = (usersData, resumesData) => {
    const today = startOfDay(new Date());
    const todayStr = today.toISOString();
    
    const activeCount = usersData.filter(u => u.status === 'active').length;
    const premiumCount = usersData.filter(u => u.role === 'premium').length;
    const suspendedCount = usersData.filter(u => u.status === 'suspended').length;
    const newUsersToday = usersData.filter(u => u.createdAt && u.createdAt >= todayStr).length;
    const newResumesToday = resumesData.filter(r => r.createdAt && r.createdAt >= todayStr).length;
    const conversionRate = activeCount > 0 ? ((premiumCount / activeCount) * 100).toFixed(1) : 0;

    setStats({
      totalUsers: usersData.length,
      totalResumes: resumesData.length,
      activeUsers: activeCount,
      premiumUsers: premiumCount,
      suspendedUsers: suspendedCount,
      newUsersToday,
      newResumesToday,
      conversionRate
    });

    prepareChartData(usersData, resumesData);
  };

  const prepareChartData = (usersData, resumesData) => {
    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
    
    const lastDays = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    // Daily resumes
    const dailyResumes = lastDays.map(date => 
      resumesData.filter(r => r.createdAt?.startsWith(date)).length
    );

    // Daily new users
    const dailyUsers = lastDays.map(date => 
      usersData.filter(u => u.createdAt?.startsWith(date)).length
    );

    // Template usage
    const templateCounts = {};
    resumesData.forEach(r => {
      const template = r.template || 'modern';
      templateCounts[template] = (templateCounts[template] || 0) + 1;
    });

    setChartData({
      daily: {
        labels: lastDays.map(d => format(new Date(d), 'EEE')),
        datasets: [{
          label: 'Resumes Created',
          data: dailyResumes,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      userGrowth: {
        labels: lastDays.map(d => format(new Date(d), 'EEE')),
        datasets: [{
          label: 'New Users',
          data: dailyUsers,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      templates: {
        labels: Object.keys(templateCounts).map(t => t.charAt(0).toUpperCase() + t.slice(1)),
        datasets: [{
          data: Object.values(templateCounts),
          backgroundColor: [
            'rgba(99, 102, 241, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(14, 165, 233, 0.8)'
          ]
        }]
      }
    });
  };

  const handleDeleteUser = async (userId) => {
    try {
      // Delete user's resumes first
      const userResumes = resumes.filter(r => r.userId === userId);
      const batch = writeBatch(db);
      
      userResumes.forEach(resume => {
        const resumeRef = doc(db, 'resumes', resume.id);
        batch.delete(resumeRef);
      });
      
      const userRef = doc(db, 'users', userId);
      batch.delete(userRef);
      
      await batch.commit();
      
      toast.success('User and all associated data deleted successfully');
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      toast.error('No users selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.size} users?`)) return;

    setBulkActionLoading(true);
    try {
      const batch = writeBatch(db);
      
      for (const userId of selectedUsers) {
        // Delete user's resumes
        const userResumes = resumes.filter(r => r.userId === userId);
        userResumes.forEach(resume => {
          const resumeRef = doc(db, 'resumes', resume.id);
          batch.delete(resumeRef);
        });
        
        const userRef = doc(db, 'users', userId);
        batch.delete(userRef);
      }
      
      await batch.commit();
      
      toast.success(`${selectedUsers.size} users deleted successfully`);
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete users');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleSuspendUser = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: currentStatus === 'active' ? 'suspended' : 'active',
        updatedAt: new Date().toISOString()
      });
      toast.success(`User ${currentStatus === 'active' ? 'suspended' : 'activated'} successfully`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleBulkSuspend = async (suspend) => {
    if (selectedUsers.size === 0) {
      toast.error('No users selected');
      return;
    }

    setBulkActionLoading(true);
    try {
      const batch = writeBatch(db);
      
      for (const userId of selectedUsers) {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          status: suspend ? 'suspended' : 'active',
          updatedAt: new Date().toISOString()
        });
      }
      
      await batch.commit();
      
      toast.success(`${selectedUsers.size} users ${suspend ? 'suspended' : 'activated'} successfully`);
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Bulk suspend error:', error);
      toast.error('Failed to update users');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      toast.success('User role updated successfully');
      setShowUserModal(false);
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const exportData = {
        users,
        resumes,
        stats,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'createdAt') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [users, searchTerm, filterRole, filterStatus, sortField, sortDirection]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  const toggleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card p-5 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity ${color}" />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold mt-1">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend > 0 ? <FiTrendingUp /> : <FiTrendingDown />}
              {Math.abs(trend)}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            loading={exportLoading}
            icon={<FiDownload />}
          >
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            icon={<FiRefreshCw />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={FiUsers}
          color="from-blue-500 to-blue-600"
          trend={12}
          subtitle={`+${stats.newUsersToday} today`}
        />
        <StatCard
          title="Total Resumes"
          value={stats.totalResumes}
          icon={FiFileText}
          color="from-purple-500 to-purple-600"
          trend={8}
          subtitle={`+${stats.newResumesToday} today`}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={FiActivity}
          color="from-green-500 to-green-600"
          subtitle={`${stats.suspendedUsers} suspended`}
        />
        <StatCard
          title="Premium Users"
          value={stats.premiumUsers}
          icon={FiAward}
          color="from-orange-500 to-orange-600"
          subtitle={`${stats.conversionRate}% conversion`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Resume Creation Trend</h3>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                prepareChartData(users, resumes);
              }}
              className="text-sm border rounded-lg px-2 py-1 dark:bg-gray-800"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
            </select>
          </div>
          {chartData.daily.labels?.length > 0 && (
            <Line
              data={chartData.daily}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                  x: { grid: { display: false } }
                }
              }}
            />
          )}
        </Card>

        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Template Usage Distribution</h3>
          {chartData.templates.labels?.length > 0 && (
            <Doughnut
              data={chartData.templates}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' }
                },
                cutout: '60%'
              }}
            />
          )}
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">User Growth</h3>
        {chartData.userGrowth.labels?.length > 0 && (
          <Bar
            data={chartData.userGrowth}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        )}
      </Card>

      {/* Users Management */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold">User Management</h3>
          
          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            {/* Filters */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="premium">Premium</option>
              <option value="admin">Admin</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-between"
          >
            <span className="text-sm">
              <span className="font-medium">{selectedUsers.size}</span> users selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedUsers(new Set())}
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkSuspend(true)}
                loading={bulkActionLoading}
                icon={<FiUserX />}
              >
                Suspend
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkSuspend(false)}
                loading={bulkActionLoading}
                icon={<FiUserCheck />}
              >
                Activate
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleBulkDelete}
                loading={bulkActionLoading}
                icon={<FiTrash2 />}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th 
                  className="text-left py-3 px-2 cursor-pointer hover:text-primary-500"
                  onClick={() => handleSort('displayName')}
                >
                  User {sortField === 'displayName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left py-3 px-2 cursor-pointer hover:text-primary-500"
                  onClick={() => handleSort('email')}
                >
                  Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left py-3 px-2">Role</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Resumes</th>
                <th 
                  className="text-left py-3 px-2 cursor-pointer hover:text-primary-500"
                  onClick={() => handleSort('createdAt')}
                >
                  Joined {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(user => {
                const userResumeCount = resumes.filter(r => r.userId === user.id).length;
                
                return (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        <span className="font-medium text-sm">{user.displayName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={user.role === 'admin' ? 'danger' : user.role === 'premium' ? 'warning' : 'primary'}
                        size="sm"
                      >
                        {user.role || 'user'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={user.status === 'active' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {user.status || 'active'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                      {userResumeCount}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-500">
                      {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          aria-label="View user"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSuspendUser(user.id, user.status)}
                          className={`p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg ${
                            user.status === 'active' ? 'text-yellow-600' : 'text-green-600'
                          }`}
                          aria-label={user.status === 'active' ? 'Suspend user' : 'Activate user'}
                        >
                          {user.status === 'active' ? <FiUserX className="w-4 h-4" /> : <FiUserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(user.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600"
                          aria-label="Delete user"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Details"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-semibold">
                {selectedUser.photoURL ? (
                  <img src={selectedUser.photoURL} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  selectedUser.displayName?.[0]?.toUpperCase() || selectedUser.email?.[0]?.toUpperCase()
                )}
              </div>
              <div>
                <h4 className="font-semibold text-lg">{selectedUser.displayName || 'N/A'}</h4>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                <p className="text-xs text-gray-400">ID: {selectedUser.id}</p>
              </div>
            </div>

            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone</label>
                <p className="text-sm">{selectedUser.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email Verified</label>
                <Badge variant={selectedUser.emailVerified ? 'success' : 'warning'} size="sm">
                  {selectedUser.emailVerified ? 'Verified' : 'Not Verified'}
                </Badge>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Auth Provider</label>
                <p className="text-sm">{selectedUser.authProvider || 'Email/Password'}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Last Login</label>
                <p className="text-sm">{selectedUser.lastLogin ? format(new Date(selectedUser.lastLogin), 'MMM dd, yyyy') : 'Never'}</p>
              </div>
            </div>

            {/* Editable Fields */}
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select 
                defaultValue={selectedUser.role || 'user'} 
                className="input-field"
                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select 
                defaultValue={selectedUser.status || 'active'} 
                className="input-field"
                onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Resume Count */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>{resumes.filter(r => r.userId === selectedUser.id).length}</strong> resumes created
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowUserModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateUserRole(selectedUser.id, selectedUser.role)}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setUserToDelete(null);
        }}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <FiAlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">
              This action cannot be undone. All user data including resumes will be permanently deleted.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => handleDeleteUser(userToDelete)}>
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;