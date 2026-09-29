import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  collection,
  doc,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import toast from 'react-hot-toast';
import { format, startOfDay } from 'date-fns';
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
  FiEye,
  FiAward,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiLoader,
  FiLock,
} from 'react-icons/fi';

// ── Constants ───────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

// Firestore caps a single `writeBatch` at 500 operations. Leave headroom
// for the SDK by capping bulk updates at 400 per batch.
const FIRESTORE_BATCH_LIMIT = 400;

// The admin dashboard subscribes to the `users` and `resumes` collections.
// Without a cap, Firestore streams every document on mount and re-reads any
// changed document on every write, which exhausts the Spark-plan daily read
// quota on even a modest tenant. These limits bound the initial load and the
// per-write re-read cost deterministically. Accurate totals are fetched
// separately via `getCountFromServer`.
const ADMIN_USERS_LIMIT = 100;
const ADMIN_RESUMES_LIMIT = 200;

// ── Timestamp normalisation ─────────────────────────────────────────────
// Firestore returns Timestamp objects for `createdAt` / `updatedAt`. Those
// objects have no `valueOf` / `Symbol.toPrimitive`, so `new Date(timestamp)`
// yields `Invalid Date` and comparing a Timestamp to an ISO string is a
// lexicographic object-vs-string comparison that evaluates to a meaningless
// result (in practice, always false). Normalising once at ingestion keeps
// every downstream consumer working with plain Date objects.
const normalizeTimestamp = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return new Date(value.getTime());
  return value;
};

// ── StatCard Component (Outside Main Component) ────────────────────────────

const StatCard = React.memo(({ title, value, icon: Icon, color, trend, subtitle }) => (
  <motion.div whileHover={{ y: -4 }} className="glass-card p-5 relative overflow-hidden group">
    <div
      className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity ${color}`}
    />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-bold mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <p
            className={`text-sm mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}
          >
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
  const { userRole, getToken } = useAuth();

  // Permission check
  const isAdmin = userRole === 'admin';

  // Refs for cleanup
  const unsubscribeRefs = useRef([]);
  const mountedRef = useRef(true);

  // State
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalResumes: 0,
    activeUsers: 0,
    premiumUsers: 0,
    suspendedUsers: 0,
    newUsersToday: 0,
    newResumesToday: 0,
    conversionRate: 0,
  });
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [totalUserCount, setTotalUserCount] = useState(0);
  const [totalResumeCount, setTotalResumeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // Tracks which action is loading
  // H-09: the actual timestamp of the last successful count refresh,
  // rather than a wall-clock time recomputed on every render.
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // ── Redirect non-admins ──────────────────────────────────────────────────

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error('You do not have permission to access the admin dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  // ── Aggregate Counts (server-side, cheap) ────────────────────────────────
  // These are separate from the paginated subscriptions below: the loaded
  // window gives the table and derived stats, while these give accurate
  // totals that do not require reading the collections.

  const refreshTotalCounts = useCallback(async () => {
    try {
      const [usersSnap, resumesSnap] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'resumes')),
      ]);
      if (!mountedRef.current) return;
      setTotalUserCount(usersSnap.data().count || 0);
      setTotalResumeCount(resumesSnap.data().count || 0);
      // H-09: stamp the header with the moment the count query resolved.
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch total counts:', err);
      // Retain previous values on failure; do not spam toasts.
    }
  }, []);

  // ── Real-time Subscriptions (bounded) ────────────────────────────────────
  // The initial load and per-write re-read cost are both capped by
  // ADMIN_USERS_LIMIT / ADMIN_RESUMES_LIMIT. Accurate totals come from
  // `refreshTotalCounts()` above.

  useEffect(() => {
    mountedRef.current = true;

    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(ADMIN_USERS_LIMIT)
    );

    const resumesQuery = query(
      collection(db, 'resumes'),
      orderBy('createdAt', 'desc'),
      limit(ADMIN_RESUMES_LIMIT)
    );

    const unsubUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        if (!mountedRef.current) return;
        const usersData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: normalizeTimestamp(data.createdAt),
            updatedAt: normalizeTimestamp(data.updatedAt),
          };
        });
        setUsers(usersData);
      },
      (err) => {
        console.error('Users subscription error:', err);
        if (mountedRef.current) {
          setError('Failed to load users data');
          toast.error('Failed to load users data');
        }
      }
    );

    const unsubResumes = onSnapshot(
      resumesQuery,
      (snapshot) => {
        if (!mountedRef.current) return;
        const resumesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: normalizeTimestamp(data.createdAt),
            updatedAt: normalizeTimestamp(data.updatedAt),
          };
        });
        setResumes(resumesData);
      },
      (err) => {
        console.error('Resumes subscription error:', err);
        if (mountedRef.current) {
          toast.error('Failed to load resumes data');
        }
      }
    );

    unsubscribeRefs.current = [unsubUsers, unsubResumes];

    // Fetch accurate totals once. These do not need to be real-time because
    // they are only used for the "Total" stat cards.
    refreshTotalCounts();

    setLoading(false);

    return () => {
      mountedRef.current = false;
      unsubscribeRefs.current.forEach((unsub) => unsub?.());
    };
  }, [refreshTotalCounts]);

  // ── Update Stats ─────────────────────────────────────────────────────────
  // Total users / total resumes use the accurate server-side counts. The
  // remaining metrics are computed from the bounded loaded window, which is
  // the most recent ADMIN_USERS_LIMIT / ADMIN_RESUMES_LIMIT documents.
  //
  // `today` is a Date (not an ISO string). Comparing a Date to a Date is a
  // numerically correct comparison; comparing a Timestamp to an ISO string
  // would fall back to a meaningless object-vs-string comparison and
  // effectively always return false, which is why the "today" counters were
  // always zero.

  useEffect(() => {
    const today = startOfDay(new Date());

    const activeCount = users.filter((u) => u.status === 'active').length;
    const premiumCount = users.filter((u) => u.role === 'premium' || u.role === 'admin').length;
    const suspendedCount = users.filter((u) => u.status === 'suspended').length;
    const newUsersToday = users.filter(
      (u) => u.createdAt instanceof Date && u.createdAt >= today
    ).length;
    const newResumesToday = resumes.filter(
      (r) => r.createdAt instanceof Date && r.createdAt >= today
    ).length;
    const conversionRate = activeCount > 0 ? ((premiumCount / activeCount) * 100).toFixed(1) : 0;

    setStats({
      totalUsers: totalUserCount,
      totalResumes: totalResumeCount,
      activeUsers: activeCount,
      premiumUsers: premiumCount,
      suspendedUsers: suspendedCount,
      newUsersToday,
      newResumesToday,
      conversionRate,
    });
  }, [users, resumes, totalUserCount, totalResumeCount]);

  // ── Filtered Users (Memoized) ────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) => u.displayName?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((u) => u.status === filterStatus);
    }

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'createdAt') {
        aVal = aVal instanceof Date ? aVal.getTime() : 0;
        bVal = bVal instanceof Date ? bVal.getTime() : 0;
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

  // M-20: precomputed map of userId -> resume count. Building this once per
  // `resumes` change reduces the per-render cost of the table from
  // O(rows × resumes) to O(rows + resumes).
  const resumeCountByUser = useMemo(() => {
    const map = new Map();
    resumes.forEach((r) => {
      if (!r.userId) return;
      map.set(r.userId, (map.get(r.userId) || 0) + 1);
    });
    return map;
  }, [resumes]);

  // ── Reset page on filter change ──────────────────────────────────────────

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSort = useCallback((field) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
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
      setSelectedUsers(new Set(paginatedUsers.map((u) => u.id)));
    }
  }, [selectedUsers.size, paginatedUsers]);

  const toggleSelectUser = useCallback((userId) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  // ── C-07: server-side delete via the `delete-user` Netlify Function ─────
  //
  // The server-side endpoint performs the entire delete: Firestore cleanup
  // (resumes, notifications, sessions, settings, subscriptions, the user
  // document) AND the Firebase Auth account removal. The client cannot
  // delete another user's Auth account directly, so delegating the whole
  // operation to the server keeps it atomic from the caller's perspective.
  //
  // Response shapes:
  //   { success: true, userId }                     on complete success
  //   { message, partial: true }  (500)             Firestore done, Auth pending
  //   { message }                 (4xx / 500)       hard failure
  const deleteUser = useCallback(
    async (userId) => {
      const token = await getToken(true);
      if (!token) {
        throw Object.assign(new Error('Unable to authenticate'), { code: 'auth/no-token' });
      }

      const response = await fetch('/.netlify/functions/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data?.message || 'Failed to delete user');
        if (data?.partial) error.partial = true;
        throw error;
      }

      return data;
    },
    [getToken]
  );

  const handleDeleteUser = useCallback(
    async (userId) => {
      if (!userId) return;
      setActionLoading(`delete-${userId}`);
      try {
        await deleteUser(userId);
        await refreshTotalCounts();

        toast.success('User deleted successfully');
        setShowDeleteConfirm(false);
        setUserToDelete(null);
      } catch (error) {
        console.error('Delete user error:', error);
        // On a partial failure, the endpoint provides a specific message
        // telling the admin the Auth deletion still needs to be retried.
        toast.error(error?.partial ? error.message : 'Failed to delete user');
      } finally {
        setActionLoading(null);
      }
    },
    [deleteUser, refreshTotalCounts]
  );

  const handleSuspendUser = useCallback(async (userId, currentStatus) => {
    setActionLoading(`suspend-${userId}`);
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: currentStatus === 'active' ? 'suspended' : 'active',
        // H-08: use serverTimestamp() so this field is consistent with
        // every other writer in the codebase.
        updatedAt: serverTimestamp(),
      });
      toast.success(`User ${currentStatus === 'active' ? 'suspended' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  }, []);

  // ── C-06: Bulk operations ────────────────────────────────────────────────

  const handleBulkSuspend = useCallback(async () => {
    const ids = Array.from(selectedUsers);
    if (ids.length === 0) return;

    setActionLoading('bulk-suspend');
    try {
      for (let i = 0; i < ids.length; i += FIRESTORE_BATCH_LIMIT) {
        const chunk = ids.slice(i, i + FIRESTORE_BATCH_LIMIT);
        const batch = writeBatch(db);
        chunk.forEach((uid) => {
          batch.update(doc(db, 'users', uid), {
            status: 'suspended',
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }

      toast.success(`${ids.length} user${ids.length === 1 ? '' : 's'} suspended`);
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Bulk suspend error:', error);
      toast.error('Failed to suspend users');
    } finally {
      setActionLoading(null);
    }
  }, [selectedUsers]);

  const handleBulkActivate = useCallback(async () => {
    const ids = Array.from(selectedUsers);
    if (ids.length === 0) return;

    setActionLoading('bulk-activate');
    try {
      for (let i = 0; i < ids.length; i += FIRESTORE_BATCH_LIMIT) {
        const chunk = ids.slice(i, i + FIRESTORE_BATCH_LIMIT);
        const batch = writeBatch(db);
        chunk.forEach((uid) => {
          batch.update(doc(db, 'users', uid), {
            status: 'active',
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }

      toast.success(`${ids.length} user${ids.length === 1 ? '' : 's'} activated`);
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Bulk activate error:', error);
      toast.error('Failed to activate users');
    } finally {
      setActionLoading(null);
    }
  }, [selectedUsers]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedUsers);
    if (ids.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${ids.length} user${ids.length === 1 ? '' : 's'}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setActionLoading('bulk-delete');
    try {
      // Sequential calls to keep per-second write quota predictable and to
      // surface a partial failure clearly rather than silently succeeding
      // for some IDs and failing for others.
      const failed = [];
      for (const uid of ids) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await deleteUser(uid);
        } catch (err) {
          console.error('Bulk delete failed for', uid, err);
          failed.push(uid);
        }
      }

      await refreshTotalCounts();

      const succeeded = ids.length - failed.length;

      if (failed.length === 0) {
        toast.success(`Deleted ${ids.length} user${ids.length === 1 ? '' : 's'}`);
        setSelectedUsers(new Set());
      } else if (succeeded > 0) {
        toast.error(
          `Deleted ${succeeded} of ${ids.length} users. ${failed.length} failed — they remain selected so you can retry.`
        );
        // Keep the failed users selected so the admin can retry without
        // re-selecting them from scratch.
        setSelectedUsers(new Set(failed));
      } else {
        toast.error('Failed to delete users');
      }
    } finally {
      setActionLoading(null);
    }
  }, [selectedUsers, deleteUser, refreshTotalCounts]);

  const handleRefresh = useCallback(() => {
    // Firestore real-time listeners auto-update the loaded window; the
    // aggregate counts are the only thing that needs an explicit refresh.
    refreshTotalCounts();
    toast.success('Data refreshed');
  }, [refreshTotalCounts]);

  // ── Loading State ────────────────────────────────────────────────────────

  if (loading) return <DashboardSkeleton />;

  // ── Unauthorized State ───────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <FiLock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">
            You need administrator privileges to access this page.
          </p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
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
          <Button onClick={() => window.location.reload()}>Retry</Button>
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
            Last updated: {lastUpdated ? format(lastUpdated, 'MMM dd, yyyy HH:mm') : '—'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} icon={<FiRefreshCw />}>
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
          subtitle={`+${stats.newUsersToday} today`}
        />
        <StatCard
          title="Total Resumes"
          value={stats.totalResumes}
          icon={FiFileText}
          color="from-purple-500 to-purple-600"
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

      {/* Users Table */}
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
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedUsers(new Set())}
                disabled={actionLoading === 'bulk-delete'}
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<FiUserX />}
                onClick={handleBulkSuspend}
                loading={actionLoading === 'bulk-suspend'}
                disabled={actionLoading !== null}
              >
                Suspend
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<FiUserCheck />}
                onClick={handleBulkActivate}
                loading={actionLoading === 'bulk-activate'}
                disabled={actionLoading !== null}
              >
                Activate
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={<FiTrash2 />}
                onClick={handleBulkDelete}
                loading={actionLoading === 'bulk-delete'}
                disabled={actionLoading !== null}
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
                    checked={
                      selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th
                  className="text-left py-3 px-2 cursor-pointer"
                  onClick={() => handleSort('displayName')}
                >
                  User {sortField === 'displayName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-left py-3 px-2 cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left py-3 px-2">Role</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Resumes</th>
                <th
                  className="text-left py-3 px-2 cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  Joined {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => {
                const userResumeCount = resumeCountByUser.get(user.id) || 0;
                const isSuspending = actionLoading === `suspend-${user.id}`;
                const isDeleting = actionLoading === `delete-${user.id}`;

                return (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
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
                          {user.displayName?.[0]?.toUpperCase() ||
                            user.email?.[0]?.toUpperCase() ||
                            'U'}
                        </div>
                        <span className="font-medium text-sm">{user.displayName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={
                          user.role === 'admin'
                            ? 'danger'
                            : user.role === 'premium'
                              ? 'warning'
                              : 'primary'
                        }
                        size="sm"
                      >
                        {user.role || 'user'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={user.status === 'active' ? 'success' : 'warning'} size="sm">
                        {user.status || 'active'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                      {userResumeCount}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-500">
                      {user.createdAt instanceof Date
                        ? format(user.createdAt, 'MMM dd, yyyy')
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            toast(`${user.displayName || 'User'} - ${user.email || 'no email'}`, {
                              icon: 'ℹ️',
                              duration: 4000,
                            })
                          }
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
                          onClick={() => {
                            setUserToDelete(user.id);
                            setShowDeleteConfirm(true);
                          }}
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
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of{' '}
              {filteredUsers.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
        onClose={() => {
          setShowDeleteConfirm(false);
          setUserToDelete(null);
        }}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">
              This action cannot be undone. All user data including resumes will be permanently
              deleted.
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
