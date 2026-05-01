import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, query, where, deleteDoc, doc, addDoc,
  updateDoc, onSnapshot, writeBatch 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiFileText, FiSearch, FiGrid, FiList,
  FiDownload, FiTrash2, FiTrendingUp, FiTrendingDown,
  FiAward, FiClock, FiCheckCircle, FiAlertCircle,
  FiTarget, FiZap, FiRefreshCw, FiX, FiStar,
  FiBarChart2, FiUpload, FiEdit
} from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Progress from '../ui/Progress';
import Modal from '../ui/Modal';
import ResumeCard from './ResumeCard';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

// ── Constants ───────────────────────────────────────────────────────────────
const TEMPLATES = ['modern', 'classic', 'creative', 'minimal', 'executive', 'tech'];
const TEMPLATE_ICONS = {
  modern: '🎨', classic: '📄', creative: '✨',
  minimal: '◻️', executive: '👔', tech: '💻',
};

// ── StatCard Component (Extracted) ─────────────────────────────────────────

const StatCard = React.memo(({ title, value, icon: Icon, color, subtitle, trend }) => (
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
        {trend !== undefined && trend !== 0 && (
          <p className={`text-sm mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? <FiTrendingUp /> : <FiTrendingDown />}
            {Math.abs(trend)}% from last week
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

// ── QuickActionCard (Extracted) ────────────────────────────────────────────

const QuickActionCard = React.memo(({ icon, title, description, onClick, color }) => (
  <motion.div
    whileHover={{ y: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="glass-card p-4 cursor-pointer group"
  >
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
      <span className="text-white text-lg">{icon}</span>
    </div>
    <h4 className="font-semibold text-sm mb-1">{title}</h4>
    <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
  </motion.div>
));

QuickActionCard.displayName = 'QuickActionCard';

// ── Main Component ─────────────────────────────────────────────────────────

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedResumes, setSelectedResumes] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0, completed: 0, inProgress: 0,
    avgScore: 0, bestScore: 0, totalDownloads: 0,
    lastUpdated: null, scoreTrend: 0,
  });

  const mountedRef = useRef(true);

  // ── Real-time Subscription ─────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'resumes'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!mountedRef.current) return;
        
        const resumesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setResumes(resumesData);
        setStats(calculateStats(resumesData));
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching resumes:', err);
        if (mountedRef.current) {
          setError('Failed to load resumes. Please try refreshing.');
          setLoading(false);
          toast.error('Failed to load resumes');
        }
      }
    );

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [user]);

  // ── Calculate Stats (Pure Function) ───────────────────────────────────

  const calculateStats = useCallback((resumesData) => {
    const completed = resumesData.filter(r => r.status === 'completed' || r.atsScore >= 80).length;
    const scores = resumesData.map(r => r.atsScore || 0).filter(s => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const totalDownloads = resumesData.reduce((sum, r) => sum + (r.downloadCount || 0), 0);

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

    const lastWeekScores = resumesData
      .filter(r => r.lastModified && new Date(r.lastModified).getTime() > weekAgo)
      .map(r => r.atsScore || 0).filter(s => s > 0);
    const prevWeekScores = resumesData
      .filter(r => r.lastModified && new Date(r.lastModified).getTime() > twoWeeksAgo && new Date(r.lastModified).getTime() < weekAgo)
      .map(r => r.atsScore || 0).filter(s => s > 0);

    const lastWeekAvg = lastWeekScores.length > 0 ? lastWeekScores.reduce((a, b) => a + b, 0) / lastWeekScores.length : 0;
    const prevWeekAvg = prevWeekScores.length > 0 ? prevWeekScores.reduce((a, b) => a + b, 0) / prevWeekScores.length : 0;
    const scoreTrend = prevWeekAvg > 0 ? Math.round(((lastWeekAvg - prevWeekAvg) / prevWeekAvg) * 100) : 0;

    const sortedByDate = [...resumesData].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return {
      total: resumesData.length,
      completed,
      inProgress: resumesData.length - completed,
      avgScore, bestScore, totalDownloads,
      lastUpdated: sortedByDate[0]?.updatedAt || null,
      scoreTrend,
    };
  }, []);

  // ── Filtered Resumes (Memoized) ───────────────────────────────────────

  const filteredResumes = useMemo(() => {
    let filtered = [...resumes];

    if (searchTerm.trim()) {
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
        if (filterStatus === 'in-progress') return r.status !== 'completed' && (!r.atsScore || r.atsScore < 80);
        if (filterStatus === 'high-score') return r.atsScore >= 80;
        if (filterStatus === 'needs-work') return r.atsScore < 60;
        return true;
      });
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'updatedAt':
        case 'createdAt':
          aVal = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
          bVal = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
          break;
        case 'atsScore':
          aVal = a.atsScore || 0;
          bVal = b.atsScore || 0;
          break;
        case 'name':
          return sortDirection === 'asc'
            ? (a.name || '').localeCompare(b.name || '')
            : (b.name || '').localeCompare(a.name || '');
        default:
          return 0;
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [resumes, searchTerm, filterStatus, sortBy, sortDirection]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleDeleteResume = useCallback(async (resumeId) => {
    setActionLoading(`delete-${resumeId}`);
    try {
      await deleteDoc(doc(db, 'resumes', resumeId));
      toast.success('Resume deleted');
      setShowDeleteConfirm(false);
      setResumeToDelete(null);
      setSelectedResumes(prev => {
        const next = new Set(prev);
        next.delete(resumeId);
        return next;
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete resume');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleDuplicateResume = useCallback(async (resume) => {
    setActionLoading(`duplicate-${resume.id}`);
    try {
      const { id, ...resumeData } = resume;
      const newResume = {
        ...resumeData,
        name: `${resume.name || 'Untitled'} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
        downloadCount: 0,
      };
      
      const docRef = await addDoc(collection(db, 'resumes'), newResume);
      toast.success('Resume duplicated');
      navigate(`/builder/${docRef.id}`);
    } catch (error) {
      console.error('Duplicate error:', error);
      toast.error('Failed to duplicate resume');
    } finally {
      setActionLoading(null);
    }
  }, [navigate]);

  const handleDownload = useCallback(async (resume) => {
    toast.loading('Preparing download...', { id: 'pdf-download' });
    try {
      // FIXED: Use dynamic import to avoid crash if module doesn't exist
      const { generatePDF } = await import('../../utils/pdfGenerator').catch(() => ({
        generatePDF: () => { throw new Error('PDF generator not available'); }
      }));
      
      await generatePDF(resume);
      
      await updateDoc(doc(db, 'resumes', resume.id), {
        downloadCount: (resume.downloadCount || 0) + 1,
        lastDownloaded: new Date().toISOString(),
      });
      
      toast.success('Resume downloaded', { id: 'pdf-download' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download resume', { id: 'pdf-download' });
    }
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedResumes.size === filteredResumes.length) {
      setSelectedResumes(new Set());
    } else {
      setSelectedResumes(new Set(filteredResumes.map(r => r.id)));
    }
  }, [selectedResumes.size, filteredResumes]);

  const toggleSelectResume = useCallback((resumeId) => {
    setSelectedResumes(prev => {
      const next = new Set(prev);
      next.has(resumeId) ? next.delete(resumeId) : next.add(resumeId);
      return next;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    toast.success('Data is already up to date');
  }, []);

  // ── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center p-8">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} icon={<FiRefreshCw />}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 sm:pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1">
              Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Manage your resumes and track your progress
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleRefresh} icon={<FiRefreshCw />}>
              Refresh
            </Button>
            <Button onClick={() => setShowTemplateModal(true)} icon={<FiPlus />}
              className="bg-gradient-to-r from-primary-500 to-accent-500">
              Create New Resume
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard title="Total Resumes" value={stats.total} icon={FiFileText}
            color="from-blue-500 to-blue-600"
            subtitle={stats.total > 0 ? `${stats.completed} completed` : undefined} />
          <StatCard title="Average ATS Score" value={`${stats.avgScore}%`} icon={FiTarget}
            color="from-purple-500 to-purple-600"
            subtitle={`Best: ${stats.bestScore}%`} trend={stats.scoreTrend} />
          <StatCard title="Total Downloads" value={stats.totalDownloads} icon={FiDownload}
            color="from-green-500 to-green-600" />
          <StatCard title="Last Updated" 
            value={stats.lastUpdated ? formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true }) : 'Never'}
            icon={FiClock} color="from-orange-500 to-orange-600" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <QuickActionCard icon={<FiZap />} title="ATS Scanner"
            description="Analyze existing resume" onClick={() => navigate('/ats-scanner')}
            color="from-yellow-500 to-orange-500" />
          <QuickActionCard icon={<FiUpload />} title="Import"
            description="Import from LinkedIn" onClick={() => toast('Coming soon!')}
            color="from-blue-500 to-cyan-500" />
          <QuickActionCard icon={<FiBarChart2 />} title="Analytics"
            description="View detailed stats" onClick={() => navigate('/analytics')}
            color="from-purple-500 to-pink-500" />
          <QuickActionCard icon={<FiStar />} title="Templates"
            description="Browse templates" onClick={() => setShowTemplateModal(true)}
            color="from-green-500 to-emerald-500" />
        </div>

        {/* Resume List */}
        <Card className="p-4 sm:p-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold">My Resumes</h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 sm:flex-none">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search resumes..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm">
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="high-score">High Score</option>
                <option value="needs-work">Needs Work</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm">
                <option value="updatedAt">Last Modified</option>
                <option value="createdAt">Date Created</option>
                <option value="name">Name</option>
                <option value="atsScore">ATS Score</option>
              </select>
              <button onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-500'}`}>
                  <FiGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-500'}`}>
                  <FiList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedResumes.size > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-between">
              <span className="text-sm"><span className="font-medium">{selectedResumes.size}</span> selected</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setSelectedResumes(new Set())}>Clear</Button>
                <Button size="sm" variant="danger" onClick={() => setShowDeleteConfirm(true)} icon={<FiTrash2 />}>
                  Delete
                </Button>
              </div>
            </motion.div>
          )}

          {/* Resume Grid */}
          {filteredResumes.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <FiFileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No resumes found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Create your first resume'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button onClick={() => setShowTemplateModal(true)} icon={<FiPlus />}>
                  Create Your First Resume
                </Button>
              )}
            </motion.div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                <input type="checkbox" checked={selectedResumes.size === filteredResumes.length && filteredResumes.length > 0}
                  onChange={toggleSelectAll} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-gray-500">Select All</span>
              </div>
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' 
                : 'space-y-3'}>
                <AnimatePresence mode="popLayout">
                  {filteredResumes.map(resume => (
                    <motion.div key={resume.id} layout
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <ResumeCard resume={resume}
                        viewMode={viewMode === 'list' ? 'compact' : 'grid'}
                        selected={selectedResumes.has(resume.id)}
                        onSelect={() => toggleSelectResume(resume.id)}
                        onEdit={() => navigate(`/builder/${resume.id}`)}
                        onDelete={() => { setResumeToDelete(resume.id); setShowDeleteConfirm(true); }}
                        onDuplicate={() => handleDuplicateResume(resume)}
                        onDownload={() => handleDownload(resume)}
                        onPreview={() => navigate(`/preview/${resume.id}`)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </Card>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setResumeToDelete(null); }}
          title="Delete Resume" size="sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">
                {selectedResumes.size > 1 
                  ? `Permanently delete ${selectedResumes.size} resumes?`
                  : 'This cannot be undone. The resume will be permanently deleted.'}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setResumeToDelete(null); }}>
                Cancel
              </Button>
              <Button variant="danger" 
                loading={actionLoading?.startsWith('delete')}
                onClick={() => selectedResumes.size > 1 ? handleDeleteResume(resumeToDelete) : handleDeleteResume(resumeToDelete)}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>

        {/* Template Modal - simplified */}
        <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Choose Template" size="lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {TEMPLATES.map(template => (
              <motion.div key={template} whileHover={{ scale: 1.02 }}
                className="cursor-pointer" onClick={() => { setShowTemplateModal(false); navigate(`/builder?template=${template}`); }}>
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg mb-2 flex items-center justify-center text-4xl">
                  {TEMPLATE_ICONS[template]}
                </div>
                <p className="text-center text-sm font-medium capitalize">{template}</p>
              </motion.div>
            ))}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default UserDashboard;