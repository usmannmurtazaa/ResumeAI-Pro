import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiFileText, FiPlus, FiSearch, FiFilter, FiGrid, FiList,
  FiChevronDown, FiChevronUp, FiEdit3, FiTrash2, FiCopy,
  FiDownload, FiEye, FiMoreVertical, FiX, FiCheckCircle,
  FiClock, FiTarget, FiArrowUp, FiArrowDown, FiLayout,
} from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Progress from '../components/ui/Progress';
import Tooltip from '../components/ui/Tooltip';
import Modal from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/Modal';
import { useResume } from '../contexts/ResumeContext';
import { useAuth } from '../contexts/AuthContext';
import { generatePDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

const MyResumes = () => {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const { resumes, loading, deleteResume, duplicateResume, incrementDownloadCount, stats } = useResume();
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('resumeViewMode') || 'grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTemplate, setFilterTemplate] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const FREE_LIMIT = 5;

  const templates = useMemo(() => {
    const unique = new Set(resumes.map(r => r.template).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [resumes]);

  const filteredResumes = useMemo(() => {
    let filtered = [...resumes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(term) ||
        r.data?.personal?.fullName?.toLowerCase().includes(term) ||
        r.data?.personal?.title?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => {
        if (filterStatus === 'completed') return r.status === 'completed' || r.atsScore >= 80;
        if (filterStatus === 'draft') return r.status !== 'completed' && (!r.atsScore || r.atsScore < 80);
        if (filterStatus === 'high-score') return r.atsScore >= 80;
        if (filterStatus === 'needs-work') return r.atsScore < 60;
        return true;
      });
    }

    if (filterTemplate !== 'all') {
      filtered = filtered.filter(r => r.template === filterTemplate);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'updatedAt':
          comparison = new Date(a.updatedAt) - new Date(b.updatedAt);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'score':
          comparison = (a.atsScore || 0) - (b.atsScore || 0);
          break;
        case 'downloads':
          comparison = (a.downloadCount || 0) - (b.downloadCount || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [resumes, searchTerm, filterStatus, filterTemplate, sortBy, sortOrder]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('resumeViewMode', mode);
  };

  const handleCreateResume = () => {
    if (!isPremium && resumes.length >= FREE_LIMIT) {
      toast.error(`Free plan limited to ${FREE_LIMIT} resumes. Upgrade to Pro!`);
      navigate('/pricing');
      return;
    }
    setShowTemplateModal(true);
  };

  const handleSelectTemplate = (template) => {
    setShowTemplateModal(false);
    navigate(`/builder?template=${template}`);
  };

  const handleEdit = (resume) => {
    navigate(`/builder/${resume.id}`);
  };

  const handlePreview = (resume) => {
    navigate(`/preview/${resume.id}`);
  };

  const handleDelete = async () => {
    if (!selectedResume) return;
    await deleteResume(selectedResume.id);
    setShowDeleteModal(false);
    setSelectedResume(null);
  };

  const handleDuplicate = async (resume) => {
    if (!isPremium && resumes.length >= FREE_LIMIT) {
      toast.error(`Free plan limited to ${FREE_LIMIT} resumes. Upgrade to Pro!`);
      return;
    }
    await duplicateResume(resume);
  };

  const handleDownload = async (resume) => {
    setDownloading(resume.id);
    try {
      await generatePDF(resume.data, resume.template);
      await incrementDownloadCount(resume.id);
      toast.success('Resume downloaded!');
    } catch (error) {
      toast.error('Failed to download resume');
    } finally {
      setDownloading(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterTemplate('all');
  };

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterTemplate !== 'all';

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const templates_list = [
    { id: 'modern', name: 'Modern', icon: '🎨', color: 'from-blue-500 to-cyan-500' },
    { id: 'classic', name: 'Classic', icon: '📄', color: 'from-gray-600 to-gray-800' },
    { id: 'creative', name: 'Creative', icon: '✨', color: 'from-purple-500 to-pink-500' },
    { id: 'minimal', name: 'Minimal', icon: '◻️', color: 'from-green-500 to-emerald-500' },
    { id: 'executive', name: 'Executive', icon: '👔', color: 'from-slate-700 to-slate-900' },
    { id: 'tech', name: 'Tech', icon: '💻', color: 'from-indigo-500 to-blue-600' },
  ];

  return (
    <DashboardLayout title="My Resumes" description="Manage and organize your resumes">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={FiFileText} label="Total Resumes" value={stats?.total || 0} color="bg-blue-500" />
          <StatCard icon={FiCheckCircle} label="Completed" value={stats?.completed || 0} color="bg-green-500" />
          <StatCard icon={FiTarget} label="Avg ATS Score" value={`${stats?.avgScore || 0}%`} color="bg-purple-500" />
          <StatCard icon={FiDownload} label="Downloads" value={stats?.totalDownloads || 0} color="bg-orange-500" />
        </div>

        {/* Free Limit Warning */}
        {!isPremium && resumes.length >= 4 && (
          <div className={`p-4 rounded-xl border ${resumes.length >= FREE_LIMIT ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiAlertCircle className={`w-5 h-5 ${resumes.length >= FREE_LIMIT ? 'text-red-500' : 'text-yellow-500'}`} />
                <div>
                  <p className="font-medium">
                    {resumes.length >= FREE_LIMIT 
                      ? `Free plan limit reached (${FREE_LIMIT} resumes)`
                      : `${FREE_LIMIT - resumes.length} free resume${FREE_LIMIT - resumes.length !== 1 ? 's' : ''} remaining`}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upgrade to Pro for unlimited resumes and premium features.
                  </p>
                </div>
              </div>
              <Button size="sm" variant={resumes.length >= FREE_LIMIT ? 'primary' : 'outline'} onClick={() => navigate('/pricing')}>
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search resumes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} icon={<FiFilter />}>
                Filters {hasActiveFilters && '•'}
              </Button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
              >
                <option value="updatedAt">Last Modified</option>
                <option value="createdAt">Date Created</option>
                <option value="name">Name</option>
                <option value="score">ATS Score</option>
                <option value="downloads">Downloads</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />}
              </button>

              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : ''}`}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : ''}`}
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>

              <Button onClick={handleCreateResume} icon={<FiPlus />} disabled={!isPremium && resumes.length >= FREE_LIMIT}>
                New Resume
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-end gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                      <option value="all">All</option>
                      <option value="completed">Completed</option>
                      <option value="draft">Draft</option>
                      <option value="high-score">High Score (80%+)</option>
                      <option value="needs-work">Needs Work (&lt;60%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Template</label>
                    <select value={filterTemplate} onChange={(e) => setFilterTemplate(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 capitalize">
                      {templates.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                  </div>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>Clear Filters</Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Resume Grid/List */}
        {filteredResumes.length === 0 ? (
          <Card className="p-12 text-center">
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No resumes found</h3>
            <p className="text-gray-500 mb-4">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first resume to get started'}
            </p>
            {!hasActiveFilters && <Button onClick={handleCreateResume} icon={<FiPlus />}>Create Resume</Button>}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResumes.map(resume => (
              <ResumeGridCard
                key={resume.id}
                resume={resume}
                onEdit={() => handleEdit(resume)}
                onPreview={() => handlePreview(resume)}
                onDownload={() => handleDownload(resume)}
                onDuplicate={() => handleDuplicate(resume)}
                onDelete={() => { setSelectedResume(resume); setShowDeleteModal(true); }}
                downloading={downloading === resume.id}
              />
            ))}
          </div>
        ) : (
          <ResumeListTable
            resumes={filteredResumes}
            onEdit={handleEdit}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onDuplicate={handleDuplicate}
            onDelete={(resume) => { setSelectedResume(resume); setShowDeleteModal(true); }}
            downloading={downloading}
          />
        )}
      </div>

      {/* Template Selection Modal */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Choose Template" size="lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {templates_list.map(template => (
            <button key={template.id} onClick={() => handleSelectTemplate(template.id)} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 transition-all text-left">
              <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${template.color} mb-3 flex items-center justify-center text-3xl`}>{template.icon}</div>
              <p className="font-medium">{template.name}</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Resume"
        message={`Are you sure you want to delete "${selectedResume?.name || 'this resume'}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </DashboardLayout>
  );
};

// Stat Card Component
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

// Grid Card Component
const ResumeGridCard = ({ resume, onEdit, onPreview, onDownload, onDuplicate, onDelete, downloading }) => {
  const score = resume.atsScore || 0;
  const scoreColor = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
      <Card className="p-5 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{resume.name || 'Untitled'}</h3>
            <p className="text-sm text-gray-500 truncate">{resume.data?.personal?.fullName || 'No name'}</p>
          </div>
          <Badge variant="secondary" size="sm" className="capitalize">{resume.template || 'modern'}</Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ATS Score</span>
            <span className={`font-semibold ${scoreColor}`}>{score}%</span>
          </div>
          <Progress value={score} size="sm" color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>Updated {new Date(resume.updatedAt).toLocaleDateString()}</span>
          <span>{resume.downloadCount || 0} downloads</span>
        </div>

        <div className="flex gap-1 mt-auto">
          <Tooltip content="Edit"><button onClick={onEdit} className="flex-1 p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg hover:bg-primary-100"><FiEdit3 className="w-4 h-4 mx-auto" /></button></Tooltip>
          <Tooltip content="Preview"><button onClick={onPreview} className="flex-1 p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg hover:bg-purple-100"><FiEye className="w-4 h-4 mx-auto" /></button></Tooltip>
          <Tooltip content="Download"><button onClick={onDownload} disabled={downloading} className="flex-1 p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg hover:bg-green-100"><FiDownload className="w-4 h-4 mx-auto" /></button></Tooltip>
          <Tooltip content="Duplicate"><button onClick={onDuplicate} className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100"><FiCopy className="w-4 h-4 mx-auto" /></button></Tooltip>
          <Tooltip content="Delete"><button onClick={onDelete} className="flex-1 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100"><FiTrash2 className="w-4 h-4 mx-auto" /></button></Tooltip>
        </div>
      </Card>
    </motion.div>
  );
};

// List Table Component
const ResumeListTable = ({ resumes, onEdit, onPreview, onDownload, onDuplicate, onDelete, downloading }) => (
  <Card className="overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <th className="text-left py-3 px-4">Name</th>
            <th className="text-left py-3 px-4">Template</th>
            <th className="text-left py-3 px-4">ATS Score</th>
            <th className="text-left py-3 px-4">Updated</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {resumes.map(resume => (
            <tr key={resume.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="py-3 px-4">
                <p className="font-medium">{resume.name || 'Untitled'}</p>
                <p className="text-sm text-gray-500">{resume.data?.personal?.fullName}</p>
              </td>
              <td className="py-3 px-4"><Badge variant="secondary" size="sm" className="capitalize">{resume.template}</Badge></td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${resume.atsScore >= 80 ? 'text-green-500' : resume.atsScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{resume.atsScore || 0}%</span>
                  <Progress value={resume.atsScore || 0} size="sm" className="w-16" />
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">{new Date(resume.updatedAt).toLocaleDateString()}</td>
              <td className="py-3 px-4">
                <Badge variant={resume.atsScore >= 80 ? 'success' : 'warning'} size="sm">{resume.atsScore >= 80 ? 'Ready' : 'Draft'}</Badge>
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  <Tooltip content="Edit"><button onClick={() => onEdit(resume)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiEdit3 className="w-4 h-4" /></button></Tooltip>
                  <Tooltip content="Preview"><button onClick={() => onPreview(resume)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiEye className="w-4 h-4" /></button></Tooltip>
                  <Tooltip content="Download"><button onClick={() => onDownload(resume)} disabled={downloading === resume.id} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiDownload className="w-4 h-4" /></button></Tooltip>
                  <Tooltip content="Duplicate"><button onClick={() => onDuplicate(resume)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiCopy className="w-4 h-4" /></button></Tooltip>
                  <Tooltip content="Delete"><button onClick={() => onDelete(resume)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg"><FiTrash2 className="w-4 h-4" /></button></Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

export default MyResumes;