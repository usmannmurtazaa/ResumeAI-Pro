import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiFileText, FiPlus, FiSearch, FiFilter, FiGrid, FiList,
  FiEdit3, FiTrash2, FiCopy, FiDownload, FiEye,
  FiX, FiCheckCircle, FiTarget, FiArrowUp, FiArrowDown,
  FiAlertCircle, FiClock,
} from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import Tooltip from '../components/ui/Tooltip';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import { useResume } from '../contexts/ResumeContext';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const FREE_LIMIT = 5;

const TEMPLATES = [
  { id: 'modern', name: 'Modern', icon: '🎨', color: 'from-blue-500 to-cyan-500' },
  { id: 'classic', name: 'Classic', icon: '📄', color: 'from-gray-600 to-gray-800' },
  { id: 'creative', name: 'Creative', icon: '✨', color: 'from-purple-500 to-pink-500' },
  { id: 'minimal', name: 'Minimal', icon: '◻️', color: 'from-green-500 to-emerald-500' },
  { id: 'executive', name: 'Executive', icon: '👔', color: 'from-slate-700 to-slate-900' },
  { id: 'tech', name: 'Tech', icon: '💻', color: 'from-indigo-500 to-blue-600' },
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last Modified' },
  { value: 'createdAt', label: 'Date Created' },
  { value: 'name', label: 'Name' },
  { value: 'score', label: 'ATS Score' },
  { value: 'downloads', label: 'Downloads' },
];

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};

const getScoreVariant = (score) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
};

// ── Sub-Components ────────────────────────────────────────────────────────

const StatCard = React.memo(({ icon: Icon, label, value, color }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className={cn('p-3 rounded-xl', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </Card>
));

StatCard.displayName = 'StatCard';

const ResumeGridCard = React.memo(({ resume, onEdit, onPreview, onDownload, onDuplicate, onDelete, downloading }) => {
  const score = resume.atsScore || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
      <Card className="p-5 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{resume.name || 'Untitled'}</h3>
            <p className="text-xs text-gray-500 truncate">{resume.data?.personal?.fullName || 'No name'}</p>
          </div>
          <Badge variant="secondary" size="sm" className="capitalize flex-shrink-0">{resume.template || 'modern'}</Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">ATS Score</span>
            <span className={`font-semibold ${getScoreColor(score)}`}>{score}%</span>
          </div>
          <Progress value={score} size="sm" color={getScoreVariant(score)} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span><FiClock className="w-3 h-3 inline mr-1" />{new Date(resume.updatedAt).toLocaleDateString()}</span>
          <span>{resume.downloadCount || 0} downloads</span>
        </div>

        <div className="flex gap-1 mt-auto">
          {[
            { onClick: onEdit, icon: FiEdit3, color: 'primary', label: 'Edit' },
            { onClick: onPreview, icon: FiEye, color: 'purple', label: 'Preview' },
            { onClick: onDownload, icon: FiDownload, color: 'green', label: 'Download', loading: downloading },
            { onClick: onDuplicate, icon: FiCopy, color: 'blue', label: 'Duplicate' },
            { onClick: onDelete, icon: FiTrash2, color: 'red', label: 'Delete' },
          ].map(({ onClick, icon: Icon, color, label, loading }) => (
            <Tooltip key={label} content={label}>
              <button onClick={onClick} disabled={loading}
                className={`flex-1 p-2 bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400 rounded-lg hover:bg-${color}-100 dark:hover:bg-${color}-900/30 transition-colors disabled:opacity-50`}>
                <Icon className="w-4 h-4 mx-auto" />
              </button>
            </Tooltip>
          ))}
        </div>
      </Card>
    </motion.div>
  );
});

ResumeGridCard.displayName = 'ResumeGridCard';

// ── Main Component ────────────────────────────────────────────────────────

const MyResumes = () => {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const { resumes = [], loading, deleteResume, duplicateResume, incrementDownloadCount, stats = {} } = useResume();

  usePageTitle({
    title: 'My Resumes',
    description: 'Manage and organize your professional resumes.',
  });

  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('resumeViewMode') || 'grid'; }
    catch { return 'grid'; }
  });
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

  const canCreate = isPremium || resumes.length < FREE_LIMIT;
  const remaining = isPremium ? Infinity : Math.max(0, FREE_LIMIT - resumes.length);

  // ── Derived data ────────────────────────────────────────────────────

  const templates = useMemo(() => {
    const unique = new Set(resumes.map(r => r.template).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [resumes]);

  const filteredResumes = useMemo(() => {
    let filtered = [...resumes];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(term) ||
        r.data?.personal?.fullName?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => {
        if (filterStatus === 'completed') return r.atsScore >= 80;
        if (filterStatus === 'draft') return (r.atsScore || 0) < 80;
        if (filterStatus === 'high-score') return (r.atsScore || 0) >= 80;
        if (filterStatus === 'needs-work') return (r.atsScore || 0) < 60;
        return true;
      });
    }

    if (filterTemplate !== 'all') {
      filtered = filtered.filter(r => r.template === filterTemplate);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
        comparison = new Date(a[sortBy] || 0).getTime() - new Date(b[sortBy] || 0).getTime();
      } else if (sortBy === 'score') {
        comparison = (a.atsScore || 0) - (b.atsScore || 0);
      } else if (sortBy === 'downloads') {
        comparison = (a.downloadCount || 0) - (b.downloadCount || 0);
      } else if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [resumes, searchTerm, filterStatus, filterTemplate, sortBy, sortOrder]);

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterTemplate !== 'all';

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    try { localStorage.setItem('resumeViewMode', mode); } catch {}
  }, []);

  const handleCreateResume = useCallback(() => {
    if (!canCreate) {
      toast.error(`Free plan: ${FREE_LIMIT} resumes max. Upgrade to Pro!`);
      navigate('/pricing');
      return;
    }
    setShowTemplateModal(true);
  }, [canCreate, navigate]);

  const handleSelectTemplate = useCallback((template) => {
    setShowTemplateModal(false);
    navigate(`/builder?template=${template}`);
  }, [navigate]);

  const handleEdit = useCallback((resume) => navigate(`/builder/${resume.id}`), [navigate]);
  const handlePreview = useCallback((resume) => navigate(`/preview/${resume.id}`), [navigate]);

  const handleDelete = useCallback(async () => {
    if (!selectedResume) return;
    await deleteResume(selectedResume.id);
    setShowDeleteModal(false);
    setSelectedResume(null);
  }, [selectedResume, deleteResume]);

  const handleDuplicate = useCallback(async (resume) => {
    if (!canCreate) {
      toast.error(`Free plan: ${FREE_LIMIT} resumes max.`);
      return;
    }
    await duplicateResume(resume);
  }, [canCreate, duplicateResume]);

  const handleDownload = useCallback(async (resume) => {
    setDownloading(resume.id);
    try {
      // FIXED: Safe PDF generation
      try {
        const { generatePDF } = await import('../utils/pdfGenerator');
        await generatePDF(resume.data, resume.template);
      } catch {
        window.print();
      }
      await incrementDownloadCount(resume.id);
      toast.success('Resume downloaded!');
    } catch {
      toast.error('Failed to download');
    } finally {
      setDownloading(null);
    }
  }, [incrementDownloadCount]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterTemplate('all');
  }, []);

  return (
    <DashboardLayout title="My Resumes" description="Manage your resumes" showWelcome={false}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={FiFileText} label="Total Resumes" value={stats?.total || 0} color="bg-blue-500" />
          <StatCard icon={FiCheckCircle} label="Completed" value={stats?.completed || 0} color="bg-green-500" />
          <StatCard icon={FiTarget} label="Avg ATS Score" value={`${stats?.avgScore || 0}%`} color="bg-purple-500" />
          <StatCard icon={FiDownload} label="Downloads" value={stats?.totalDownloads || 0} color="bg-orange-500" />
        </div>

        {/* Free Limit Warning */}
        {!isPremium && resumes.length >= FREE_LIMIT - 1 && (
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            resumes.length >= FREE_LIMIT 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <FiAlertCircle className={`w-5 h-5 flex-shrink-0 ${resumes.length >= FREE_LIMIT ? 'text-red-500' : 'text-yellow-500'}`} />
              <div>
                <p className="font-medium text-sm">
                  {resumes.length >= FREE_LIMIT ? 'Free limit reached' : `${remaining} free resume${remaining !== 1 ? 's' : ''} remaining`}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Upgrade for unlimited resumes</p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate('/pricing')} className="flex-shrink-0">Upgrade</Button>
          </div>
        )}

        {/* Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search resumes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 text-sm" />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} icon={<FiFilter />}>
                Filters {hasActiveFilters && '•'}
              </Button>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm">
                {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                {sortOrder === 'asc' ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />}
              </button>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {['grid', 'list'].map(mode => (
                  <button key={mode} onClick={() => handleViewModeChange(mode)}
                    className={`p-2 rounded-md ${viewMode === mode ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-500'}`}>
                    {mode === 'grid' ? <FiGrid className="w-4 h-4" /> : <FiList className="w-4 h-4" />}
                  </button>
                ))}
              </div>
              <Button onClick={handleCreateResume} icon={<FiPlus />} disabled={!canCreate} size="sm">New</Button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-wrap items-end gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus}
                    options={[
                      { value: 'all', label: 'All' }, { value: 'completed', label: 'Completed' },
                      { value: 'draft', label: 'Draft' }, { value: 'high-score', label: 'High Score' },
                    ]} />
                  <FilterSelect label="Template" value={filterTemplate} onChange={setFilterTemplate}
                    options={templates.map(t => ({ value: t, label: t === 'all' ? 'All' : t }))} />
                  {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Content */}
        {filteredResumes.length === 0 ? (
          <Card className="p-12 text-center">
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No resumes found</h3>
            <p className="text-gray-500 mb-4">{hasActiveFilters ? 'Try adjusting filters' : 'Create your first resume'}</p>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResumes.map(resume => (
              <ResumeGridCard key={resume.id} resume={resume}
                onEdit={() => handleEdit(resume)} onPreview={() => handlePreview(resume)}
                onDownload={() => handleDownload(resume)} onDuplicate={() => handleDuplicate(resume)}
                onDelete={() => { setSelectedResume(resume); setShowDeleteModal(true); }}
                downloading={downloading === resume.id} />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Template</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">ATS Score</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Updated</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResumes.map(resume => (
                    <tr key={resume.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-sm">{resume.name || 'Untitled'}</p>
                        <p className="text-xs text-gray-500">{resume.data?.personal?.fullName}</p>
                      </td>
                      <td className="py-3 px-4"><Badge variant="secondary" size="sm" className="capitalize">{resume.template}</Badge></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${getScoreColor(resume.atsScore || 0)}`}>{resume.atsScore || 0}%</span>
                          <Progress value={resume.atsScore || 0} size="sm" className="w-16" color={getScoreVariant(resume.atsScore || 0)} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{new Date(resume.updatedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {[
                            { onClick: () => handleEdit(resume), icon: FiEdit3, label: 'Edit' },
                            { onClick: () => handlePreview(resume), icon: FiEye, label: 'Preview' },
                            { onClick: () => handleDownload(resume), icon: FiDownload, label: 'Download', loading: downloading === resume.id },
                            { onClick: () => handleDuplicate(resume), icon: FiCopy, label: 'Duplicate' },
                            { onClick: () => { setSelectedResume(resume); setShowDeleteModal(true); }, icon: FiTrash2, label: 'Delete', danger: true },
                          ].map(({ onClick, icon: Icon, label, loading, danger }) => (
                            <Tooltip key={label} content={label}>
                              <button onClick={onClick} disabled={loading}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <Icon className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Template Modal */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Choose Template" size="lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => handleSelectTemplate(t.id)}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 transition-all text-left">
              <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${t.color} mb-3 flex items-center justify-center text-3xl`}>{t.icon}</div>
              <p className="font-medium text-sm">{t.name}</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete}
        title="Delete Resume" message={`Delete "${selectedResume?.name || 'this resume'}"? This cannot be undone.`}
        confirmText="Delete" confirmVariant="danger" />
    </DashboardLayout>
  );
};

// ── FilterSelect Component ────────────────────────────────────────────────

const FilterSelect = React.memo(({ label, value, onChange, options }) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm capitalize">
      {options.map(opt => <option key={opt.value} value={opt.value} className="capitalize">{opt.label}</option>)}
    </select>
  </div>
));

FilterSelect.displayName = 'FilterSelect';

export default MyResumes;