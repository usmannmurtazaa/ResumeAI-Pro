import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, getDocs, deleteDoc, doc, updateDoc, 
  query, where, orderBy, limit, onSnapshot, writeBatch 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import toast from 'react-hot-toast';
import { format, subDays, startOfDay } from 'date-fns';
import {
  FiUsers, FiFileText, FiActivity, FiTrendingUp, FiTrendingDown,
  FiSearch, FiTrash2, FiUserX, FiUserCheck, FiEye, FiShield,
  FiAward, FiDownload, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiAlertCircle, FiLoader, FiBarChart2, FiPieChart, FiLock
} from 'react-icons/fi';

// ── Constants ───────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;
const DATE_RANGES = { '7days': 7, '30days': 30, '90days': 90 };

// ── StatCard Component (Outside Main Component) ────────────────────────────

const StatCard = React.memo(({ title, value, icon: Icon, color, trend, subtitle }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="glass-card p-5 relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity ${color}`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-bold mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
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
));

StatCard.displayName = 'StatCard';

// ── Loading Skeleton ───────────────────────────────────────────────────────

const DashboardSkeleton = () => (
  <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-card p-5">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  
  // Permission check
  const isAdmin = userRole === 'admin';
  
  // Refs for cleanup
  const unsubscribeRefs = useRef([]);
  const mountedRef = useRef(true);

  // State
  const [stats, setStats] = useState({
    totalUsers: 0, totalResumes: 0, activeUsers: 0,
    premiumUsers: 0, suspendedUsers: 0,
    newUsersToday: 0, newResumesToday: 0, conversionRate: 0,
  });
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // Track which action is loading
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [dateRange, setDateRange] = useState('7days');
  
  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // ── Redirect non-admins ──────────────────────────────────────────────────

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error('You do not have permission to access the admin dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  // ── Real-time Subscriptions ──────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    
    // FIXED: Proper cleanup with refs
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!mountedRef.current) return;
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
      },
      (error) => {
        console.error('Users subscription error:', error);
        if (mountedRef.current) {
          setError('Failed to load users data');
          toast.error('Failed to load users data');
        }
      }
    );

    const unsubResumes = onSnapshot(
      collection(db, 'resumes'),
      (snapshot) => {
        if (!mountedRef.current) return;
        const resumesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResumes(resumesData);
      },
      (error) => {
        console.error('Resumes subscription error:', error);
        if (mountedRef.current) {
          toast.error('Failed to load resumes data');
        }
      }
    );

    unsubscribeRefs.current = [unsubUsers, unsubResumes];
    setLoading(false);

    return () => {
      mountedRef.current = false;
      unsubscribeRefs.current.forEach(unsub => unsub?.());
    };
  }, []); // FIXED: Empty dependency array - no need for users/resumes deps

  // ── Update Stats ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!users.length && !resumes.length) return;

    const today = startOfDay(new Date()).toISOString();
    
    const activeCount = users.filter(u => u.status === 'active').length;
    const premiumCount = users.filter(u => u.role === 'premium' || u.role === 'admin').length;
    const suspendedCount = users.filter(u => u.status === 'suspended').length;
    const newUsersToday = users.filter(u => u.createdAt >= today).length;
    const newResumesToday = resumes.filter(r => r.createdAt >= today).length;
    const conversionRate = activeCount > 0 ? ((premiumCount / activeCount) * 100).toFixed(1) : 0;

    setStats({
      totalUsers: users.length,
      totalResumes: resumes.length,
      activeUsers: activeCount,
      premiumUsers: premiumCount,
      suspendedUsers: suspendedCount,
      newUsersToday,
      newResumesToday,
      conversionRate,
    });
  }, [users, resumes]);

  // ── Filtered Users (Memoized) ────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.displayName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }
    
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
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  // ── Reset page on filter change ──────────────────────────────────────────

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSort = useCallback((field) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDirection('asc');
      return field;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  }, [selectedUsers.size, paginatedUsers]);

  const toggleSelectUser = useCallback((userId) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const handleDeleteUser = useCallback(async (userId) => {
    setActionLoading(`delete-${userId}`);
    try {
      const userResumes = resumes.filter(r => r.userId === userId);
      const batch = writeBatch(db);
      
      userResumes.forEach(resume => {
        batch.delete(doc(db, 'resumes', resume.id));
      });
      batch.delete(doc(db, 'users', userId));
      
      await batch.commit();
      toast.success('User deleted successfully');
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  }, [resumes]);

  const handleSuspendUser = useCallback(async (userId, currentStatus) => {
    setActionLoading(`suspend-${userId}`);
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: currentStatus === 'active' ? 'suspended' : 'active',
        updatedAt: new Date().toISOString(),
      });
      toast.success(`User ${currentStatus === 'active' ? 'suspended' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    // Firestore real-time listeners auto-update, but we can refetch if needed
    toast.success('Data is already real-time');
  }, []);

  // ── Loading State ────────────────────────────────────────────────────────

  if (loading) return <DashboardSkeleton />;

  // ── Unauthorized State ───────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <FiLock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500 mb-4">
            You need administrator privileges to access this page.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            icon={<FiRefreshCw />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Users" value={stats.totalUsers}
          icon={FiUsers} color="from-blue-500 to-blue-600" trend={12}
          subtitle={`+${stats.newUsersToday} today`}
        />
        <StatCard
          title="Total Resumes" value={stats.totalResumes}
          icon={FiFileText} color="from-purple-500 to-purple-600" trend={8}
          subtitle={`+${stats.newResumesToday} today`}
        />
        <StatCard
          title="Active Users" value={stats.activeUsers}
          icon={FiActivity} color="from-green-500 to-green-600"
          subtitle={`${stats.suspendedUsers} suspended`}
        />
        <StatCard
          title="Premium Users" value={stats.premiumUsers}
          icon={FiAward} color="from-orange-500 to-orange-600"
          subtitle={`${stats.conversionRate}% conversion`}
        />
      </div>

      {/* Users Table - Simplified for brevity */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold">User Management</h3>
          <div className="flex flex-wrap gap-2">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<FiSearch />}
              className="w-full sm:w-64"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input-field !py-2 !w-auto"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="premium">Premium</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field !py-2 !w-auto"
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
              <Button size="sm" variant="ghost" onClick={() => setSelectedUsers(new Set())}>
                Clear
              </Button>
              <Button size="sm" variant="outline" icon={<FiUserX />}>
                Suspend
              </Button>
              <Button size="sm" variant="outline" icon={<FiUserCheck />}>
                Activate
              </Button>
              <Button size="sm" variant="danger" icon={<FiTrash2 />}>
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
                <th className="text-left py-3 px-2 cursor-pointer" onClick={() => handleSort('displayName')}>
                  User {sortField === 'displayName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left py-3 px-2 cursor-pointer" onClick={() => handleSort('email')}>
                  Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left py-3 px-2">Role</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Resumes</th>
                <th className="text-left py-3 px-2 cursor-pointer" onClick={() => handleSort('createdAt')}>
                  Joined {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(user => {
                const userResumeCount = resumes.filter(r => r.userId === user.id).length;
                const isSuspending = actionLoading === `suspend-${user.id}`;
                const isDeleting = actionLoading === `delete-${user.id}`;
                
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
                          {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-medium text-sm">{user.displayName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="py-3 px-2">
                      <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'premium' ? 'warning' : 'primary'} size="sm">
                        {user.role || 'user'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={user.status === 'active' ? 'success' : 'warning'} size="sm">
                        {user.status || 'active'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">{userResumeCount}</td>
                    <td className="py-3 px-2 text-sm text-gray-500">
                      {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          aria-label="View user"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSuspendUser(user.id, user.status)}
                          disabled={isSuspending}
                          className={`p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg disabled:opacity-50 ${
                            user.status === 'active' ? 'text-yellow-600' : 'text-green-600'
                          }`}
                          aria-label={user.status === 'active' ? 'Suspend user' : 'Activate user'}
                        >
                          {isSuspending ? (
                            <FiLoader className="w-4 h-4 animate-spin" />
                          ) : user.status === 'active' ? (
                            <FiUserX className="w-4 h-4" />
                          ) : (
                            <FiUserCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => { setUserToDelete(user.id); setShowDeleteConfirm(true); }}
                          disabled={isDeleting}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 disabled:opacity-50"
                          aria-label="Delete user"
                        >
                          {isDeleting ? (
                            <FiLoader className="w-4 h-4 animate-spin" />
                          ) : (
                            <FiTrash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedUsers.length === 0 && (
          <div className="text-center py-12">
            <FiSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm">Page {currentPage} of {totalPages}</span>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setUserToDelete(null); }}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">
              This action cannot be undone. All user data including resumes will be permanently deleted.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={() => handleDeleteUser(userToDelete)}
              loading={actionLoading === `delete-${userToDelete}`}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
