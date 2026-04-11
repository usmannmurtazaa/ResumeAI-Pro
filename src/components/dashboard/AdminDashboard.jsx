import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, getDocs, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  FiUsers, FiFileText, FiActivity, FiTrendingUp, FiDownload,
  FiSearch, FiFilter, FiMoreVertical, FiEdit, FiTrash2, FiUserX,
  FiEye, FiCheckCircle, FiXCircle
} from 'react-icons/fi';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Input from '../ui/Input';
import Select from '../ui/Select';
import toast from 'react-hot-toast';

// Register ChartJS components
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
    totalDownloads: 0,
    atsScans: 0
  });
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [chartData, setChartData] = useState({
    daily: { labels: [], datasets: [] },
    weekly: { labels: [], datasets: [] },
    templates: { labels: [], datasets: [] },
    users: { labels: [], datasets: [] }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

      // Fetch resumes
      const resumesSnapshot = await getDocs(collection(db, 'resumes'));
      const resumesData = resumesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setResumes(resumesData);

      // Calculate stats
      setStats({
        totalUsers: usersData.length,
        totalResumes: resumesData.length,
        activeUsers: usersData.filter(u => u.status === 'active' || !u.status).length,
        premiumUsers: usersData.filter(u => u.role === 'premium' || u.role === 'admin').length,
        totalDownloads: resumesData.reduce((acc, r) => acc + (r.downloads || 0), 0),
        atsScans: resumesData.reduce((acc, r) => acc + (r.atsScans || 0), 0)
      });

      // Prepare chart data
      prepareChartData(usersData, resumesData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (usersData, resumesData) => {
    // Daily resume creation trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyResumes = last7Days.map(date => 
      resumesData.filter(r => r.createdAt?.startsWith(date)).length
    );

    // Weekly trend (last 4 weeks)
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const week = `Week ${i + 1}`;
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (7 * (3 - i)));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return {
        label: week,
        count: resumesData.filter(r => {
          const created = new Date(r.createdAt);
          return created >= weekStart && created <= weekEnd;
        }).length
      };
    });

    // Template usage distribution
    const templateCounts = resumesData.reduce((acc, r) => {
      const template = r.template || 'modern';
      acc[template] = (acc[template] || 0) + 1;
      return acc;
    }, {});

    // User growth (last 6 months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        count: usersData.filter(u => {
          const created = new Date(u.createdAt);
          return created.getMonth() === date.getMonth() && 
                 created.getFullYear() === date.getFullYear();
        }).length
      };
    });

    setChartData({
      daily: {
        labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
        datasets: [{
          label: 'Resumes Created',
          data: dailyResumes,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      weekly: {
        labels: last4Weeks.map(w => w.label),
        datasets: [{
          label: 'Resumes per Week',
          data: last4Weeks.map(w => w.count),
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderRadius: 8
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
            'rgba(249, 115, 22, 0.8)'
          ],
          borderWidth: 0
        }]
      },
      users: {
        labels: last6Months.map(m => m.month),
        datasets: [{
          label: 'New Users',
          data: last6Months.map(m => m.count),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        }]
      }
    });
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleSuspendUser = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: currentStatus === 'active' ? 'suspended' : 'active'
      });
      toast.success(`User ${currentStatus === 'active' ? 'suspended' : 'activated'}`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    
    try {
      await deleteDoc(doc(db, 'resumes', resumeId));
      toast.success('Resume deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete resume');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus || 
                          (filterStatus === 'active' && !user.status);
    return matchesSearch && matchesStatus;
  });

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
          {trend !== undefined && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage your platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDashboardData}>
            Refresh
          </Button>
          <Button onClick={() => window.location.href = '/admin/reports'}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={FiUsers}
          color="from-blue-500 to-blue-600"
          trend={12}
        />
        <StatCard
          title="Total Resumes"
          value={stats.totalResumes}
          icon={FiFileText}
          color="from-purple-500 to-purple-600"
          trend={8}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={FiActivity}
          color="from-green-500 to-green-600"
          trend={5}
        />
        <StatCard
          title="Premium Users"
          value={stats.premiumUsers}
          icon={FiTrendingUp}
          color="from-orange-500 to-orange-600"
          trend={15}
        />
        <StatCard
          title="Total Downloads"
          value={stats.totalDownloads}
          icon={FiDownload}
          color="from-cyan-500 to-cyan-600"
          trend={10}
        />
        <StatCard
          title="ATS Scans"
          value={stats.atsScans}
          icon={FiCheckCircle}
          color="from-pink-500 to-pink-600"
          trend={7}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Resume Creation Trend (Last 7 Days)</h3>
          <Line
            data={chartData.daily}
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
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Resume Creation</h3>
          <Bar
            data={chartData.weekly}
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
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Template Usage Distribution</h3>
          <Doughnut
            data={chartData.templates}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' }
              }
            }}
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">User Growth (Last 6 Months)</h3>
          <Line
            data={chartData.users}
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
        </Card>
      </div>

      {/* User Management */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold">User Management</h3>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Users' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' }
              ]}
              className="w-40"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Resumes</th>
                <th className="text-left py-3 px-4">Joined</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.displayName || user.email} size="sm" />
                      <span className="font-medium">{user.displayName || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'premium' ? 'primary' : 'default'}>
                      {user.role || 'user'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={user.status === 'active' || !user.status ? 'success' : 'warning'}>
                      {user.status || 'active'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {resumes.filter(r => r.userId === user.id).length}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="View Details"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSuspendUser(user.id, user.status)}
                        className="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg text-yellow-600"
                        title={user.status === 'active' ? 'Suspend' : 'Activate'}
                      >
                        <FiUserX className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          )}
        </div>
      </Card>

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={selectedUser.displayName || selectedUser.email} size="xl" />
              <div>
                <h4 className="font-semibold text-lg">{selectedUser.displayName || 'N/A'}</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={selectedUser.role || 'user'}
                  className="input-field"
                  onChange={async (e) => {
                    await updateDoc(doc(db, 'users', selectedUser.id), { role: e.target.value });
                    toast.success('User role updated');
                    fetchDashboardData();
                  }}
                >
                  <option value="user">User</option>
                  <option value="premium">Premium</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={selectedUser.status || 'active'}
                  className="input-field"
                  onChange={async (e) => {
                    await updateDoc(doc(db, 'users', selectedUser.id), { status: e.target.value });
                    toast.success('User status updated');
                    fetchDashboardData();
                  }}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Joined</label>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Resumes Created</label>
              <p className="text-gray-600 dark:text-gray-400">
                {resumes.filter(r => r.userId === selectedUser.id).length}
              </p>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowUserModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;