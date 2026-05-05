import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FiFileText, FiSearch, FiFilter, FiRefreshCw, FiDownload,
  FiEye, FiTrash2, FiTarget, FiChevronLeft, FiChevronRight,
  FiAlertCircle,
} from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Tooltip from '../../components/ui/Tooltip';
import Progress from '../../components/ui/Progress';
import { ConfirmModal } from '../../components/ui/Modal';
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit, startAfter, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const RESUMES_PER_PAGE = 20;
const SCORE_COLORS = { high: 'text-green-500', medium: 'text-yellow-500', low: 'text-red-500' };

// ── Utilities ────────────────────────────────────────────────────────────

const getScoreColor = (score) => {
  if (score >= 80) return SCORE_COLORS.high;
  if (score >= 60) return SCORE_COLORS.medium;
  return SCORE_COLORS.low;
};

const getScoreVariant = (score) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
};

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

const StatCard = React.memo(({ icon: Icon, label, value, color }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
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

// ── Loading Skeleton ──────────────────────────────────────────────────────

const TableSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4">
        <div className="h-8 flex-1 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    ))}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────

const AdminResumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTemplate, setFilterTemplate] = useState('all');
  const [filterScore, setFilterScore] = useState('all');
  const [selectedResume, setSelectedResume] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, totalDownloads: 0 });

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
      collection(db, 'resumes'),
      orderBy('updatedAt', 'desc'),
      limit(RESUMES_PER_PAGE)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        if (!mountedRef.current) return;

        const resumeData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setResumes(resumeData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === RESUMES_PER_PAGE);

        // Calculate stats from all resumes (this is a separate light query or derived)
        const total = snapshot.size; // Note: this is only the current page
        const scores = resumeData.map(r => r.atsScore || 0).filter(s => s > 0);
        const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const totalDownloads = resumeData.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
        
        setStats({ total: resumeData.length, avgScore, totalDownloads });
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching resumes:', err);
        if (mountedRef.current) {
          setError(err);
          setLoading(false);
          toast.error('Failed to load resumes');
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
        collection(db, 'resumes'),
        orderBy('updatedAt', 'desc'),
        startAfter(lastVisible),
        limit(RESUMES_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      if (!mountedRef.current) return;

      const newResumes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setResumes(prev => [...prev, ...newResumes]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === RESUMES_PER_PAGE);
    } catch (err) {
      console.error('Error loading more:', err);
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [lastVisible, hasMore, loadingMore]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    if (!selectedResume) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'resumes', selectedResume.id));
      setResumes(prev => prev.filter(r => r.id !== selectedResume.id));
      toast.success('Resume deleted');
      setShowDeleteModal(false);
      setSelectedResume(null);
    } catch {
      toast.error('Failed to delete resume');
    } finally {
      if (mountedRef.current) setIsDeleting(false);
    }
  }, [selectedResume]);

  const handleExport = useCallback(() => {
    // FIXED: Proper CSV escaping
    const headers = ['Name', 'User ID', 'Template', 'ATS Score', 'Downloads', 'Updated'];
    const rows = filteredResumes.map(r => [
      escapeCSV(r.name || 'Untitled'),
      escapeCSV(r.userId),
      escapeCSV(r.template || 'modern'),
      r.atsScore || 0,
      r.downloadCount || 0,
      escapeCSV(formatDate(r.updatedAt)),
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumes-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} resumes!`);
  }, [resumes, searchTerm, filterTemplate, filterScore]);

  // ── FIXED: Memoized derived data ────────────────────────────────────

  const templates = useMemo(() => {
    const unique = new Set(resumes.map(r => r.template).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [resumes]);

  const filteredResumes = useMemo(() => {
    let filtered = resumes;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(term) ||
        r.data?.personal?.fullName?.toLowerCase().includes(term) ||
        r.userId?.toLowerCase().includes(term)
      );
    }

    if (filterTemplate !== 'all') {
      filtered = filtered.filter(r => r.template === filterTemplate);
    }

    if (filterScore !== 'all') {
      filtered = filtered.filter(r => {
        const score = r.atsScore || 0;
        if (filterScore === 'high') return score >= 80;
        if (filterScore === 'medium') return score >= 60 && score < 80;
        if (filterScore === 'low') return score < 60;
        return true;
      });
    }

    return filtered;
  }, [resumes, searchTerm, filterTemplate, filterScore]);

  return (
    <AdminLayout title="Resume Management" description="Manage all platform resumes">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={FiFileText} label="Total Resumes (loaded)" value={stats.total} color="bg-blue-500" />
          <StatCard icon={FiTarget} label="Average ATS Score" value={`${stats.avgScore}%`} color="bg-purple-500" />
          <StatCard icon={FiDownload} label="Total Downloads" value={stats.totalDownloads} color="bg-green-500" />
        </div>

        {/* Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, user ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={filterTemplate} onChange={e => setFilterTemplate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm capitalize">
                {templates.map(t => <option key={t} value={t} className="capitalize">{t === 'all' ? 'All Templates' : t}</option>)}
              </select>
              <select value={filterScore} onChange={e => setFilterScore(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm">
                <option value="all">All Scores</option>
                <option value="high">High (80%+)</option>
                <option value="medium">Medium (60-79%)</option>
                <option value="low">Low (&lt;60%)</option>
              </select>
              <Button variant="outline" onClick={handleExport} icon={<FiDownload />} size="sm">Export</Button>
            </div>
          </div>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="p-8 text-center">
            <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Failed to load resumes</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        )}

        {/* Loading State */}
        {loading && <TableSkeleton />}

        {/* Resumes Table */}
        {!loading && !error && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Resume</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Template</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">ATS Score</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Downloads</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Updated</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResumes.map(resume => (
                    <tr key={resume.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-sm">{resume.name || 'Untitled'}</p>
                        <p className="text-xs text-gray-500">{resume.data?.personal?.fullName || 'No name'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{resume.userId?.slice(0, 8)}...</code>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" size="sm" className="capitalize">{resume.template || 'modern'}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${getScoreColor(resume.atsScore || 0)}`}>{resume.atsScore || 0}%</span>
                          <Progress value={resume.atsScore || 0} size="sm" color={getScoreVariant(resume.atsScore || 0)} className="w-16" />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{resume.downloadCount || 0}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{formatDate(resume.updatedAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Tooltip content="Preview">
                            <button onClick={() => window.open(`/preview/${resume.id}`, '_blank')}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                              <FiEye className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Delete">
                            <button onClick={() => { setSelectedResume(resume); setShowDeleteModal(true); }}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500">
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredResumes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <FiFileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        No resumes found
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

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedResume(null); }}
        onConfirm={handleDelete}
        title="Delete Resume"
        message={`Are you sure you want to delete "${selectedResume?.name || 'this resume'}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </AdminLayout>
  );
};

export default AdminResumes;
