import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers, FiSearch, FiFilter, FiChevronDown, FiChevronUp,
  FiEdit3, FiTrash2, FiUserCheck, FiUserX, FiEye,
  FiDownload, FiRefreshCw, FiMail, FiCalendar, FiMoreVertical,
  FiCheckCircle, FiAlertCircle, FiShield, FiAward,
} from 'react-icons/fi';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/Modal';
import Tooltip from '../../components/ui/Tooltip';
import Avatar from '../../components/ui/Avatar';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole, updatedAt: new Date().toISOString() });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('User role updated');
      setShowUserModal(false);
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.id), { status: newStatus, updatedAt: new Date().toISOString() });
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
      setShowSuspendModal(false);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteDoc(doc(db, 'users', selectedUser.id));
      setUsers(users.filter(u => u.id !== selectedUser.id));
      toast.success('User deleted');
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleExport = () => {
    const csv = ['Name,Email,Role,Status,Created At,Resumes'].concat(
      users.map(u => `${u.displayName || ''},${u.email},${u.role},${u.status || 'active'},${u.createdAt || ''},${u.resumeCount || 0}`)
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Users exported!');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || (user.status || 'active') === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status !== 'suspended').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    premium: users.filter(u => u.role === 'premium').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

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
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <Button variant="outline" onClick={fetchUsers} icon={<FiRefreshCw />}>Refresh</Button>
              <Button variant="outline" onClick={handleExport} icon={<FiDownload />}>Export</Button>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
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
                        <Avatar src={user.photoURL} name={user.displayName || user.email} size="sm" />
                        <span className="font-medium">{user.displayName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'premium' ? 'warning' : 'secondary'} size="sm">
                        {user.role || 'user'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.status === 'active' ? 'success' : 'warning'} size="sm">
                        {user.status || 'active'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">{user.resumeCount || 0}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Tooltip content="View Details"><button onClick={() => { setSelectedUser(user); setShowUserModal(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiEye className="w-4 h-4" /></button></Tooltip>
                        <Tooltip content={user.status === 'active' ? 'Suspend' : 'Activate'}><button onClick={() => { setSelectedUser(user); setShowSuspendModal(true); }} className={`p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg ${user.status === 'active' ? 'text-yellow-600' : 'text-green-600'}`}>{user.status === 'active' ? <FiUserX className="w-4 h-4" /> : <FiUserCheck className="w-4 h-4" />}</button></Tooltip>
                        <Tooltip content="Delete"><button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"><FiTrash2 className="w-4 h-4" /></button></Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
              <div><label className="text-xs text-gray-500">User ID</label><p className="text-sm font-mono">{selectedUser.id}</p></div>
              <div><label className="text-xs text-gray-500">Auth Provider</label><p className="text-sm">{selectedUser.authProvider || 'email'}</p></div>
              <div><label className="text-xs text-gray-500">Email Verified</label><Badge variant={selectedUser.emailVerified ? 'success' : 'warning'} size="sm">{selectedUser.emailVerified ? 'Yes' : 'No'}</Badge></div>
              <div><label className="text-xs text-gray-500">Resumes</label><p className="text-sm">{selectedUser.resumeCount || 0}</p></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select defaultValue={selectedUser.role || 'user'} onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })} className="input-field">
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
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${selectedUser?.email}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </AdminLayout>
  );
};

const StatCard = ({ label, value, color }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
        <FiUsers className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </Card>
);

export default AdminUsers;