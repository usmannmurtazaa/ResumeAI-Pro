import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiFileText, FiSearch, FiFilter, FiRefreshCw, FiDownload,
  FiEye, FiTrash2, FiCheckCircle, FiAlertCircle, FiTarget,
  FiUser, FiCalendar, FiLayout,
} from 'react-icons/fi';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Tooltip from '../../components/ui/Tooltip';
import Progress from '../../components/ui/Progress';
import { ConfirmModal } from '../../components/ui/Modal';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

const AdminResumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTemplate, setFilterTemplate] = useState('all');
  const [selectedResume, setSelectedResume] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, totalDownloads: 0 });

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'resumes'), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      const resumeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResumes(resumeData);
      
      const total = resumeData.length;
      const scores = resumeData.map(r => r.atsScore || 0).filter(s => s > 0);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const totalDownloads = resumeData.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
      setStats({ total, avgScore, totalDownloads });
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedResume) return;
    try {
      await deleteDoc(doc(db, 'resumes', selectedResume.id));
      setResumes(resumes.filter(r => r.id !== selectedResume.id));
      toast.success('Resume deleted');
      setShowDeleteModal(false);
      setSelectedResume(null);
    } catch (error) {
      toast.error('Failed to delete resume');
    }
  };

  const templates = ['all', ...new Set(resumes.map(r => r.template).filter(Boolean))];

  const filteredResumes = resumes.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.data?.personal?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTemplate = filterTemplate === 'all' || r.template === filterTemplate;
    return matchesSearch && matchesTemplate;
  });

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleExport = () => {
    const csv = ['Name,User ID,Template,ATS Score,Downloads,Updated At'].concat(
      filteredResumes.map(r => `${r.name || 'Untitled'},${r.userId},${r.template},${r.atsScore || 0},${r.downloadCount || 0},${r.updatedAt}`)
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Resumes exported!');
  };

  return (
    <AdminLayout title="Resume Management" description="Manage all platform resumes">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={FiFileText} label="Total Resumes" value={stats.total} color="bg-blue-500" />
          <StatCard icon={FiTarget} label="Average ATS Score" value={`${stats.avgScore}%`} color="bg-purple-500" />
          <StatCard icon={FiDownload} label="Total Downloads" value={stats.totalDownloads} color="bg-green-500" />
        </div>

        {/* Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={filterTemplate} onChange={(e) => setFilterTemplate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 capitalize">
                {templates.map(t => <option key={t} value={t} className="capitalize">{t || 'unknown'}</option>)}
              </select>
              <Button variant="outline" onClick={fetchResumes} icon={<FiRefreshCw />}>Refresh</Button>
              <Button variant="outline" onClick={handleExport} icon={<FiDownload />}>Export</Button>
            </div>
          </div>
        </Card>

        {/* Resumes Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4">Resume</th>
                  <th className="text-left py-3 px-4">User ID</th>
                  <th className="text-left py-3 px-4">Template</th>
                  <th className="text-left py-3 px-4">ATS Score</th>
                  <th className="text-left py-3 px-4">Downloads</th>
                  <th className="text-left py-3 px-4">Updated</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResumes.map(resume => (
                  <tr key={resume.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <p className="font-medium">{resume.name || 'Untitled'}</p>
                      <p className="text-sm text-gray-500">{resume.data?.personal?.fullName || 'No name'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{resume.userId?.slice(0, 8)}...</code>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" size="sm" className="capitalize">{resume.template || 'modern'}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getScoreColor(resume.atsScore || 0)}`}>{resume.atsScore || 0}%</span>
                        <Progress value={resume.atsScore || 0} size="sm" className="w-16" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{resume.downloadCount || 0}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Tooltip content="View"><button onClick={() => window.open(`/preview/${resume.id}`, '_blank')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiEye className="w-4 h-4" /></button></Tooltip>
                        <Tooltip content="Delete"><button onClick={() => { setSelectedResume(resume); setShowDeleteModal(true); }} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"><FiTrash2 className="w-4 h-4" /></button></Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Resume"
        message={`Are you sure you want to delete "${selectedResume?.name || 'this resume'}"?`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </AdminLayout>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </Card>
);

export default AdminResumes;