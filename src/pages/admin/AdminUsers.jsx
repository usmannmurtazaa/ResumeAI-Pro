import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers, FiSearch, FiFilter, FiUserCheck, FiUserX, FiEye,
  FiDownload, FiRefreshCw, FiTrash2, FiAlertCircle, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout'
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import Tooltip from '../../components/ui/Tooltip';
import Avatar from '../../components/ui/Avatar';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter, onSnapshot, where, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const USERS_PER_PAGE = 20;

// ── Utilities ────────────────────────────────────────────────────────────

const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    return new Date(timestamp?.toDate?.() || timestamp).toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

// ── StatCard Component ────────────────────────────────────────────────────

const StatCard = React.memo(({ label, value, color }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className={`p-3 rounded-xl ${color}`}>
        <FiUsers className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </Card>
));

StatCard.displayName = 'StatCard';

// ── Loading Skeleton ──────────────────────────────────────────────────────

const TableSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4 items-center">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-4 flex-1 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    ))}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const mountedRef = useRef(true);

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── FIXED: Real-time subscription with pagination ────────────────────

  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(USERS_PER_PAGE)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        if (!mountedRef.current) return;

        const userData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(userData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === USERS_PER_PAGE);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching users:', err);
        if (mountedRef.current) {
          setError(err);
          setLoading(false);
          toast.error('Failed to load users');
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // ── Load More ────────────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!lastVisible || !hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(USERS_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      if (!mountedRef.current) return;

      const newUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(prev => [...prev, ...newUsers]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === USERS_PER_PAGE);
    } catch (err) {
      console.error('Error loading more users:', err);
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [lastVisible, hasMore, loadingMore]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleUpdateRole = useCallback(async (userId, newRole) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('User role updated');
      setShowUserModal(false);
    } catch {
      toast.error('Failed to update role');
    } finally {
      if (mountedRef.current) setProcessing(false);
    }
  }, []);

  const handleToggleStatus = useCallback(async (user) => {
    setProcessing(true);
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
      setShowSuspendModal(false);
    } catch {
      toast.error('Failed to update status');
    } finally {
      if (mountedRef.current) setProcessing(false);
    }
  }, []);

  // FIXED: Delete user AND their resumes
  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      // First, delete all user's resumes
      const resumesQuery = query(
        collection(db, 'resumes'),
        where('userId', '==', selectedUser.id)
      );
      const resumesSnapshot = await getDocs(resumesQuery);

      const batch = writeBatch(db);
      resumesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      batch.delete(doc(db, 'users', selectedUser.id));
      await batch.commit();

      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      toast.success('User and associated data deleted');
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch {
      toast.error('Failed to delete user');
    } finally {
      if (mountedRef.current) setProcessing(false);
    }
  }, [selectedUser]);

  const handleExport = useCallback(() => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Created', 'Resumes'];
    const rows = users.map(u => [
      escapeCSV(u.displayName || ''),
      escapeCSV(u.email),
      escapeCSV(u.role || 'user'),
      escapeCSV(u.status || 'active'),
      escapeCSV(formatDate(u.createdAt)),
      u.resumeCount || 0,
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} users!`);
  }, [users]);

  // ── FIXED: Memoized derived data ────────────────────────────────────

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.displayName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => (u.role || 'user') === filterRole);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => (u.status || 'active') === filterStatus);
    }

    return filtered;
  }, [users, searchTerm, filterRole, filterStatus]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status !== 'suspended').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    premium: users.filter(u => u.role === 'premium').length,
    admin: users.filter(u => u.role === 'admin').length,
  }), [users]);

  return (
    <AdminLayout title="User Management" description="Manage platform users">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Users" value={stats.total} color="bg-blue-500" />
          <StatCard label="Active" value={stats.active} color="bg-green-500" />
          <StatCard label="Suspended" value={stats.suspended} color="bg-yellow-500" />
          <StatCard label="Premium" value={stats.premium} color="bg-purple-500" />
          <StatCard label="Admins" value={stats.admin} color="bg-red-500" />
        </div>

        {/* Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm">
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <Button variant="outline" onClick={handleExport} icon={<FiDownload />} size="sm">Export</Button>
            </div>
          </div>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="p-8 text-center">
            <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Failed to load users</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        )}

        {/* Loading State */}
        {loading && <TableSkeleton />}

        {/* Users Table */}
        {!loading && !error && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Resumes</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={user.photoURL} name={user.displayName || user.email} size="sm" />
                          <span className="font-medium text-sm">{user.displayName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'premium' ? 'warning' : 'secondary'} size="sm">
                          {user.role || 'user'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={(user.status || 'active') === 'active' ? 'success' : 'warning'} size="sm">
                          {user.status || 'active'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{user.resumeCount || 0}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Tooltip content="View Details">
                            <button onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                              <FiEye className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content={user.status === 'active' ? 'Suspend' : 'Activate'}>
                            <button onClick={() => { setSelectedUser(user); setShowSuspendModal(true); }}
                              className={`p-2 rounded-lg ${user.status === 'active' ? 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'}`}>
                              {user.status === 'active' ? <FiUserX className="w-4 h-4" /> : <FiUserCheck className="w-4 h-4" />}
                            </button>
                          </Tooltip>
                          <Tooltip content="Delete">
                            <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500">
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <FiUsers className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="p-4 text-center">
                <Button variant="outline" onClick={loadMore} loading={loadingMore} size="sm">
                  Load More
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* User Details Modal */}
      <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title="User Details">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Avatar src={selectedUser.photoURL} name={selectedUser.displayName} size="lg" />
              <div>
                <h3 className="font-semibold text-lg">{selectedUser.displayName || 'N/A'}</h3>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-500">User ID</label><p className="text-sm font-mono text-xs break-all">{selectedUser.id}</p></div>
              <div><label className="text-xs text-gray-500">Auth Provider</label><p className="text-sm">{selectedUser.authProvider || 'email'}</p></div>
              <div><label className="text-xs text-gray-500">Email Verified</label><Badge variant={selectedUser.emailVerified ? 'success' : 'warning'} size="sm">{selectedUser.emailVerified ? 'Yes' : 'No'}</Badge></div>
              <div><label className="text-xs text-gray-500">Resumes</label><p className="text-sm">{selectedUser.resumeCount || 0}</p></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select defaultValue={selectedUser.role || 'user'} onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })} className="input-field">
                <option value="user">User</option>
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowUserModal(false)}>Cancel</Button>
              <Button onClick={() => handleUpdateRole(selectedUser.id, selectedUser.role)} loading={processing}>Save</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Suspend/Activate Modal */}
      <ConfirmModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={() => handleToggleStatus(selectedUser)}
        title={selectedUser?.status === 'active' ? 'Suspend User' : 'Activate User'}
        message={`Are you sure you want to ${selectedUser?.status === 'active' ? 'suspend' : 'activate'} ${selectedUser?.email}?`}
        confirmText={selectedUser?.status === 'active' ? 'Suspend' : 'Activate'}
        confirmVariant={selectedUser?.status === 'active' ? 'warning' : 'success'}
        loading={processing}
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${selectedUser?.email}? All associated resumes will also be deleted. This cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={processing}
      />
    </AdminLayout>
  );
};

export default AdminUsers;
