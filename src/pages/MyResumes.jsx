import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiFileText,
  FiPlus,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiEdit3,
  FiTrash2,
  FiCopy,
  FiDownload,
  FiEye,
  FiX,
  FiCheckCircle,
  FiTarget,
  FiArrowUp,
  FiArrowDown,
  FiAlertCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiArchive,
  FiMoreVertical,
} from 'react-icons/fi';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import Tooltip from '../components/ui/Tooltip';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { SkeletonText, SkeletonList } from '../components/ui/Skeleton';
import { useResume } from '../contexts/ResumeContext';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const FREE_LIMIT = 5;
const PAGE_SIZES = [6, 12, 24, 48];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last Modified' },
  { value: 'createdAt', label: 'Date Created' },
  { value: 'name', label: 'Name' },
  { value: 'score', label: 'ATS Score' },
  { value: 'downloads', label: 'Downloads' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const SCORE_FILTERS = [
  { value: 'all', label: 'All Scores' },
  { value: 'excellent', label: 'Excellent (80%+)' },
  { value: 'good', label: 'Good (60-79%)' },
  { value: 'needs-work', label: 'Needs Work (<60%)' },
];

// Static lookup for the grid action buttons. Tailwind 3's JIT only emits
// classes it can see as literal substrings in the source, so a dynamic
// template like `bg-${color}-50` produces no CSS. Every class in this map
// appears verbatim so the stylesheet contains it.
const ACTION_BUTTON_TONES = {
  primary:
    'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30',
  purple:
    'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30',
  green:
    'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30',
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30',
};

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

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
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

// ── Loading Skeleton ──────────────────────────────────────────────────────

const ResumesSkeleton = () => (
  <div className="space-y-4">
    <div className="flex flex-wrap gap-4">
      <SkeletonText lines={1} className="w-64" />
      <SkeletonText lines={1} className="w-32" />
      <SkeletonText lines={1} className="w-32" />
    </div>
    <SkeletonList rows={4} />
  </div>
);

// ── ResumeGridCard ──────────────────────────────────────────────────────

const ResumeGridCard = React.memo(
  ({
    resume,
    selected,
    onSelect,
    onEdit,
    onPreview,
    onDownload,
    onDuplicate,
    onDelete,
    onArchive,
    onRename,
    downloading,
  }) => {
    const score = resume.atsScore || 0;
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      const handler = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setShowMenu(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className={cn('relative', selected && 'ring-2 ring-primary-500 rounded-xl')}
      >
        <Card className="p-5 h-full flex flex-col">
          {onSelect && (
            <div className="absolute top-3 left-3 z-10">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onSelect(resume.id)}
                onClick={(e) => e.stopPropagation()}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                aria-label={`Select ${resume.name || 'resume'}`}
              />
            </div>
          )}

          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 ml-6">
              <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                {resume.name || 'Untitled'}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {resume.data?.personal?.fullName || 'No name'}
              </p>
            </div>
            <Badge variant="secondary" size="sm" className="capitalize flex-shrink-0">
              {resume.template || 'modern'}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">ATS Score</span>
              <span className={cn('font-semibold', getScoreColor(score))}>{score}%</span>
            </div>
            <Progress value={score} size="sm" color={getScoreVariant(score)} />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <FiClock className="w-3 h-3" />
              {resume.updatedAt ? formatDate(resume.updatedAt) : 'Never'}
            </span>
            <span>{resume.downloadCount || 0} downloads</span>
          </div>

          <div className="flex gap-1 mt-auto">
            {[
              { onClick: onEdit, icon: FiEdit3, label: 'Edit', color: 'primary' },
              { onClick: onPreview, icon: FiEye, label: 'Preview', color: 'purple' },
              {
                onClick: onDownload,
                icon: FiDownload,
                label: 'Download',
                color: 'green',
                loading: downloading,
              },
              { onClick: onDuplicate, icon: FiCopy, label: 'Duplicate', color: 'blue' },
            ].map(({ onClick, icon: Icon, label, color, loading }) => (
              <Tooltip key={label} content={label}>
                <button
                  onClick={onClick}
                  disabled={loading}
                  className={cn(
                    'flex-1 p-2 rounded-lg transition-colors disabled:opacity-50',
                    ACTION_BUTTON_TONES[color] || ACTION_BUTTON_TONES.primary
                  )}
                >
                  <Icon className="w-4 h-4 mx-auto" />
                </button>
              </Tooltip>
            ))}

            {/* More Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="More options"
              >
                <FiMoreVertical className="w-4 h-4 mx-auto" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden"
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onArchive?.(resume);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <FiArchive className="w-4 h-4" />
                        Archive
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onRename?.(resume);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <FiEdit3 className="w-4 h-4" />
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete?.(resume);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }
);

ResumeGridCard.displayName = 'ResumeGridCard';

// ── ResumeTableRow ──────────────────────────────────────────────────────

const ResumeTableRow = React.memo(
  ({
    resume,
    selected,
    onSelect,
    onEdit,
    onPreview,
    onDownload,
    onDuplicate,
    onDelete,
    onArchive,
    onRename,
    downloading,
  }) => {
    const score = resume.atsScore || 0;
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      const handler = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setShowMenu(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
      <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <td className="py-3 px-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(resume.id)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            aria-label={`Select ${resume.name || 'resume'}`}
          />
        </td>
        <td className="py-3 px-3">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate max-w-[150px]">
            {resume.name || 'Untitled'}
          </p>
          <p className="text-xs text-gray-500 truncate max-w-[150px]">
            {resume.data?.personal?.fullName || 'No name'}
          </p>
        </td>
        <td className="py-3 px-3">
          <Badge variant="secondary" size="sm" className="capitalize">
            {resume.template || 'modern'}
          </Badge>
        </td>
        <td className="py-3 px-3">
          <div className="flex items-center gap-2">
            <span className={cn('font-semibold text-sm', getScoreColor(score))}>{score}%</span>
            <Progress value={score} size="sm" color={getScoreVariant(score)} className="w-16" />
          </div>
        </td>
        <td className="py-3 px-3 text-sm text-gray-500">{formatDate(resume.updatedAt)}</td>
        <td className="py-3 px-3 text-sm text-gray-500">{resume.downloadCount || 0}</td>
        <td className="py-3 px-3">
          <Badge
            variant={
              resume.status === 'archived'
                ? 'secondary'
                : resume.atsScore >= 80
                  ? 'success'
                  : 'warning'
            }
            size="sm"
          >
            {resume.status || (resume.atsScore >= 80 ? 'Completed' : 'Draft')}
          </Badge>
        </td>
        <td className="py-3 px-3">
          <div className="flex items-center gap-1">
            <Tooltip content="Edit">
              <button
                onClick={onEdit}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <FiEdit3 className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Preview">
              <button
                onClick={onPreview}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <FiEye className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Download">
              <button
                onClick={onDownload}
                disabled={downloading}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <FiDownload className="w-4 h-4" />
              </button>
            </Tooltip>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                aria-label="More options"
              >
                <FiMoreVertical className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden"
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDuplicate?.(resume);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <FiCopy className="w-4 h-4" /> Duplicate
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onArchive?.(resume);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <FiArchive className="w-4 h-4" /> Archive
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onRename?.(resume);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <FiEdit3 className="w-4 h-4" /> Rename
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete?.(resume);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600"
                      >
                        <FiTrash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </td>
      </tr>
    );
  }
);

ResumeTableRow.displayName = 'ResumeTableRow';

// ── Main Component ────────────────────────────────────────────────────────

const MyResumes = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPremium } = useAuth();
  const {
    resumes = [],
    loading,
    deleteResume,
    duplicateResume,
    incrementDownloadCount,
    stats = {},
    archiveResume,
    updateResume,
  } = useResume();

  usePageTitle({
    title: 'My Resumes',
    description: 'Manage and organize your professional resumes.',
  });

  // ── State ──────────────────────────────────────────────────────────────

  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('resumeViewMode') || 'grid';
    } catch {
      return 'grid';
    }
  });
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'updatedAt');
  const [sortOrder, setSortOrder] = useState(() => searchParams.get('order') || 'desc');
  const [filterStatus, setFilterStatus] = useState(() => searchParams.get('status') || 'all');
  const [filterTemplate, setFilterTemplate] = useState(() => searchParams.get('template') || 'all');
  const [filterScore, setFilterScore] = useState(() => searchParams.get('score') || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResumes, setSelectedResumes] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    try {
      return parseInt(localStorage.getItem('resumePageSize')) || 12;
    } catch {
      return 12;
    }
  });

  // ── Modals ─────────────────────────────────────────────────────────────

  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resumeToArchive, setResumeToArchive] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [resumeToRename, setResumeToRename] = useState(null);
  const [newName, setNewName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const canCreate = isPremium || resumes.length < FREE_LIMIT;
  const remaining = isPremium ? Infinity : Math.max(0, FREE_LIMIT - resumes.length);

  // ── Memoized Derived Data ─────────────────────────────────────────────

  const templates = useMemo(() => {
    const unique = new Set(resumes.map((r) => r.template).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [resumes]);

  const filteredResumes = useMemo(() => {
    let filtered = [...resumes];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name?.toLowerCase().includes(term) ||
          r.data?.personal?.fullName?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((r) => {
        if (filterStatus === 'completed') return r.atsScore >= 80 || r.status === 'completed';
        if (filterStatus === 'draft') return (r.atsScore || 0) < 80 && r.status !== 'archived';
        if (filterStatus === 'archived') return r.status === 'archived';
        return true;
      });
    }

    if (filterTemplate !== 'all') {
      filtered = filtered.filter((r) => r.template === filterTemplate);
    }

    if (filterScore !== 'all') {
      filtered = filtered.filter((r) => {
        const score = r.atsScore || 0;
        if (filterScore === 'excellent') return score >= 80;
        if (filterScore === 'good') return score >= 60 && score < 80;
        if (filterScore === 'needs-work') return score < 60;
        return true;
      });
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
  }, [resumes, searchTerm, filterStatus, filterTemplate, filterScore, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredResumes.length / pageSize);
  const paginatedResumes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResumes.slice(start, start + pageSize);
  }, [filteredResumes, currentPage, pageSize]);

  const hasActiveFilters =
    searchTerm || filterStatus !== 'all' || filterTemplate !== 'all' || filterScore !== 'all';

  // ── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterTemplate, filterScore, sortBy, sortOrder]);

  useEffect(() => {
    try {
      localStorage.setItem('resumePageSize', String(pageSize));
    } catch {}
  }, [pageSize]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('resumeViewMode', mode);
    } catch {}
  }, []);

  const handleCreateResume = useCallback(() => {
    if (!canCreate) {
      toast.error(`Free plan: ${FREE_LIMIT} resumes max. Upgrade to Pro!`);
      navigate('/pricing');
      return;
    }
    navigate('/builder');
  }, [canCreate, navigate]);

  const handleEdit = useCallback((resume) => navigate(`/builder/${resume.id}`), [navigate]);
  const handlePreview = useCallback((resume) => navigate(`/preview/${resume.id}`), [navigate]);

  const handleDelete = useCallback(async () => {
    if (!resumeToDelete) return;
    await deleteResume(resumeToDelete.id);
    setSelectedResumes((prev) => {
      const next = new Set(prev);
      next.delete(resumeToDelete.id);
      return next;
    });
    setShowDeleteModal(false);
    setResumeToDelete(null);
  }, [resumeToDelete, deleteResume]);

  const handleArchive = useCallback(async () => {
    if (!resumeToArchive) return;
    await archiveResume(resumeToArchive.id);
    setSelectedResumes((prev) => {
      const next = new Set(prev);
      next.delete(resumeToArchive.id);
      return next;
    });
    setShowArchiveModal(false);
    setResumeToArchive(null);
  }, [resumeToArchive, archiveResume]);

  const handleRename = useCallback(async () => {
    if (!resumeToRename || !newName.trim()) return;
    await updateResume(resumeToRename.id, { name: newName.trim() });
    setShowRenameModal(false);
    setResumeToRename(null);
    setNewName('');
  }, [resumeToRename, newName, updateResume]);

  const handleDuplicate = useCallback(
    async (resume) => {
      if (!canCreate) {
        toast.error(`Free plan: ${FREE_LIMIT} resumes max.`);
        return;
      }
      await duplicateResume(resume);
    },
    [canCreate, duplicateResume]
  );

  const handleDownload = useCallback(
    async (resume) => {
      setDownloading(resume.id);
      try {
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
    },
    [incrementDownloadCount]
  );

  const handleBulkAction = useCallback(
    async (action) => {
      const ids = Array.from(selectedResumes);
      if (ids.length === 0) return;

      if (action === 'delete') {
        const confirmed = window.confirm(
          `Delete ${ids.length} selected resumes? This cannot be undone.`
        );
        if (!confirmed) return;
        await Promise.all(ids.map((id) => deleteResume(id)));
        setSelectedResumes(new Set());
        toast.success(`Deleted ${ids.length} resumes`);
      } else if (action === 'archive') {
        await Promise.all(ids.map((id) => archiveResume(id)));
        setSelectedResumes(new Set());
        toast.success(`Archived ${ids.length} resumes`);
      }
    },
    [selectedResumes, deleteResume, archiveResume]
  );

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterTemplate('all');
    setFilterScore('all');
    setSearchParams({});
  }, [setSearchParams]);

  const toggleSelectAll = useCallback(() => {
    if (selectedResumes.size === paginatedResumes.length) {
      setSelectedResumes(new Set());
    } else {
      setSelectedResumes(new Set(paginatedResumes.map((r) => r.id)));
    }
  }, [selectedResumes.size, paginatedResumes]);

  const toggleSelectResume = useCallback((id) => {
    setSelectedResumes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Loading State ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout title="My Resumes" description="Manage your resumes" showWelcome={false}>
        <ResumesSkeleton />
      </DashboardLayout>
    );
  }

  // ── Empty State ───────────────────────────────────────────────────────

  if (resumes.length === 0 && !hasActiveFilters) {
    return (
      <DashboardLayout title="My Resumes" description="Manage your resumes" showWelcome={false}>
        <Card className="p-16 text-center">
          <FiFileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            No Resumes Yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create your first professional resume and start applying to your dream jobs.
          </p>
          <Button
            onClick={handleCreateResume}
            icon={<FiPlus />}
            className="bg-gradient-to-r from-primary-500 to-accent-500"
          >
            Create Your First Resume
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────────

  return (
    <DashboardLayout title="My Resumes" description="Manage your resumes" showWelcome={false}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={FiFileText}
            label="Total Resumes"
            value={stats?.total || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={FiCheckCircle}
            label="Completed"
            value={stats?.completed || 0}
            color="bg-green-500"
          />
          <StatCard
            icon={FiTarget}
            label="Avg ATS Score"
            value={`${stats?.avgScore || 0}%`}
            color="bg-purple-500"
          />
          <StatCard
            icon={FiDownload}
            label="Downloads"
            value={stats?.totalDownloads || 0}
            color="bg-orange-500"
          />
        </div>

        {/* Free Limit Warning */}
        {!isPremium && resumes.length >= FREE_LIMIT - 1 && (
          <div
            className={cn(
              'p-4 rounded-xl border flex items-center justify-between gap-4',
              resumes.length >= FREE_LIMIT
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <FiAlertCircle
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  resumes.length >= FREE_LIMIT ? 'text-red-500' : 'text-yellow-500'
                )}
              />
              <div>
                <p className="font-medium text-sm">
                  {resumes.length >= FREE_LIMIT
                    ? 'Free limit reached'
                    : `${remaining} free resume${remaining !== 1 ? 's' : ''} remaining`}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Upgrade for unlimited resumes
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate('/pricing')} className="flex-shrink-0">
              Upgrade
            </Button>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedResumes.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-between gap-4"
          >
            <span className="text-sm">
              <span className="font-medium">{selectedResumes.size}</span> resume
              {selectedResumes.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSelectedResumes(new Set())}>
                Clear
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('archive')}
                icon={<FiArchive />}
              >
                Archive
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleBulkAction('delete')}
                icon={<FiTrash2 />}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        )}

        {/* Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search resumes..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSearchParams((p) => {
                    if (e.target.value) p.set('q', e.target.value);
                    else p.delete('q');
                    return p;
                  });
                }}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSearchParams((p) => {
                      p.delete('q');
                      return p;
                    });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                icon={<FiFilter />}
                className={cn(hasActiveFilters && 'border-primary-500 text-primary-500')}
              >
                Filters {hasActiveFilters && '•'}
              </Button>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setSearchParams((p) => {
                    p.set('sort', e.target.value);
                    return p;
                  });
                }}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                  setSortOrder(newOrder);
                  setSearchParams((p) => {
                    p.set('order', newOrder);
                    return p;
                  });
                }}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'asc' ? (
                  <FiArrowUp className="w-4 h-4" />
                ) : (
                  <FiArrowDown className="w-4 h-4" />
                )}
              </button>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {['grid', 'list'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleViewModeChange(mode)}
                    className={cn(
                      'p-2 rounded-md',
                      viewMode === mode
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600'
                        : 'text-gray-500'
                    )}
                    aria-label={`${mode} view`}
                  >
                    {mode === 'grid' ? (
                      <FiGrid className="w-4 h-4" />
                    ) : (
                      <FiList className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleCreateResume}
                icon={<FiPlus />}
                disabled={!canCreate}
                size="sm"
              >
                New
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
                  <FilterSelect
                    label="Status"
                    value={filterStatus}
                    onChange={(v) => {
                      setFilterStatus(v);
                      setSearchParams((p) => {
                        v !== 'all' ? p.set('status', v) : p.delete('status');
                        return p;
                      });
                    }}
                    options={STATUS_OPTIONS}
                  />
                  <FilterSelect
                    label="Template"
                    value={filterTemplate}
                    onChange={(v) => {
                      setFilterTemplate(v);
                      setSearchParams((p) => {
                        v !== 'all' ? p.set('template', v) : p.delete('template');
                        return p;
                      });
                    }}
                    options={templates.map((t) => ({
                      value: t,
                      label: t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1),
                    }))}
                  />
                  <FilterSelect
                    label="ATS Score"
                    value={filterScore}
                    onChange={(v) => {
                      setFilterScore(v);
                      setSearchParams((p) => {
                        v !== 'all' ? p.set('score', v) : p.delete('score');
                        return p;
                      });
                    }}
                    options={SCORE_FILTERS}
                  />
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-red-500"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Content */}
        {filteredResumes.length === 0 ? (
          <Card className="p-12 text-center">
            <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              No resumes found
            </h3>
            <p className="text-gray-500 mb-4">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first resume'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>
                Showing {paginatedResumes.length} of {filteredResumes.length} resumes
              </span>
              {totalPages > 1 && (
                <span>
                  Page {currentPage} of {totalPages}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedResumes.map((resume) => (
                <ResumeGridCard
                  key={resume.id}
                  resume={resume}
                  selected={selectedResumes.has(resume.id)}
                  onSelect={toggleSelectResume}
                  onEdit={() => handleEdit(resume)}
                  onPreview={() => handlePreview(resume)}
                  onDownload={() => handleDownload(resume)}
                  onDuplicate={() => handleDuplicate(resume)}
                  onDelete={() => {
                    setResumeToDelete(resume);
                    setShowDeleteModal(true);
                  }}
                  onArchive={() => {
                    setResumeToArchive(resume);
                    setShowArchiveModal(true);
                  }}
                  onRename={() => {
                    setResumeToRename(resume);
                    setNewName(resume.name || '');
                    setShowRenameModal(true);
                  }}
                  downloading={downloading === resume.id}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>
                Showing {paginatedResumes.length} of {filteredResumes.length} resumes
              </span>
              {totalPages > 1 && (
                <span>
                  Page {currentPage} of {totalPages}
                </span>
              )}
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="w-10 py-3 px-3">
                        <input
                          type="checkbox"
                          checked={
                            selectedResumes.size === paginatedResumes.length &&
                            paginatedResumes.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                        Template
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                        ATS Score
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                        Updated
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                        Downloads
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResumes.map((resume) => (
                      <ResumeTableRow
                        key={resume.id}
                        resume={resume}
                        selected={selectedResumes.has(resume.id)}
                        onSelect={toggleSelectResume}
                        onEdit={() => handleEdit(resume)}
                        onPreview={() => handlePreview(resume)}
                        onDownload={() => handleDownload(resume)}
                        onDuplicate={() => handleDuplicate(resume)}
                        onDelete={() => {
                          setResumeToDelete(resume);
                          setShowDeleteModal(true);
                        }}
                        onArchive={() => {
                          setResumeToArchive(resume);
                          setShowArchiveModal(true);
                        }}
                        onRename={() => {
                          setResumeToRename(resume);
                          setNewName(resume.name || '');
                          setShowRenameModal(true);
                        }}
                        downloading={downloading === resume.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setResumeToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Resume"
        message={`Delete "${resumeToDelete?.name || 'this resume'}"? This cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* Archive Modal */}
      <ConfirmModal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setResumeToArchive(null);
        }}
        onConfirm={handleArchive}
        title="Archive Resume"
        message={`Archive "${resumeToArchive?.name || 'this resume'}"? You can restore it later.`}
        confirmText="Archive"
        confirmVariant="warning"
      />

      {/* Rename Modal */}
      <Modal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setResumeToRename(null);
          setNewName('');
        }}
        title="Rename Resume"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="New Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new resume name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
            }}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameModal(false);
                setResumeToRename(null);
                setNewName('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

// ── FilterSelect Component ──────────────────────────────────────────────

const FilterSelect = React.memo(({ label, value, onChange, options }) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm capitalize"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="capitalize">
          {opt.label}
        </option>
      ))}
    </select>
  </div>
));

FilterSelect.displayName = 'FilterSelect';

export default MyResumes;