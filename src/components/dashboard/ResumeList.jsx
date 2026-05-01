import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiFilter, FiGrid, FiList, FiArrowUp, FiArrowDown,
  FiX, FiCheckCircle, FiClock, FiCalendar,
  FiChevronLeft, FiChevronRight, FiEye, FiDownload,
  FiAlertCircle, FiRefreshCw,
} from 'react-icons/fi';
import ResumeCard from './ResumeCard';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Progress from '../ui/Progress';
import Tooltip from '../ui/Tooltip';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// ── Constants ───────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 12;
const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last Modified' },
  { value: 'createdAt', label: 'Date Created' },
  { value: 'name', label: 'Name' },
  { value: 'score', label: 'ATS Score' },
  { value: 'downloads', label: 'Downloads' },
];

// ── Utility Functions ───────────────────────────────────────────────────────

const getScoreVariant = (score) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
};

const getStatusBadge = (resume) => {
  const status = resume?.status || (resume?.atsScore >= 80 ? 'completed' : 'draft');
  const map = {
    completed: { variant: 'success', label: 'Completed', icon: <FiCheckCircle className="w-3 h-3" /> },
    draft: { variant: 'warning', label: 'Draft', icon: <FiClock className="w-3 h-3" /> },
  };
  return map[status] || { variant: 'secondary', label: status, icon: null };
};

// ── Loading Skeleton ───────────────────────────────────────────────────────

const ListSkeleton = () => (
  <div className="space-y-4">
    <div className="glass-card p-4 animate-pulse">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

// ── Empty State ────────────────────────────────────────────────────────────

const EmptyState = ({ hasFilters, onClearFilters, onCreateResume }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="glass-card p-12 text-center"
  >
    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
      <FiSearch className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No resumes found</h3>
    <p className="text-gray-500 dark:text-gray-400 mb-4">
      {hasFilters 
        ? 'Try adjusting your filters or search terms'
        : 'Create your first resume to get started'}
    </p>
    {hasFilters ? (
      <Button variant="outline" onClick={onClearFilters}>Clear Filters</Button>
    ) : (
      <Button onClick={onCreateResume}>Create Resume</Button>
    )}
  </motion.div>
);

// ── Error State ────────────────────────────────────────────────────────────

const ErrorState = ({ message, onRetry }) => (
  <div className="glass-card p-12 text-center">
    <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold mb-2">Failed to Load Resumes</h3>
    <p className="text-gray-500 mb-4">{message || 'An unexpected error occurred.'}</p>
    <Button onClick={onRetry} icon={<FiRefreshCw />}>Retry</Button>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

const ResumeList = ({ 
  resumes = [], 
  onEdit, onDelete, onDuplicate, onDownload, onPreview, onShare,
  loading = false,
  error = null,
  onRetry,
  showSelection = false,
  onSelectionChange,
  onCreateResume,
}) => {
  // View mode (persisted to localStorage)
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('resumeViewMode') || 'grid';
    } catch {
      return 'grid';
    }
  });
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTemplate, setFilterTemplate] = useState('all');
  const [filterScoreRange, setFilterScoreRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection & Pagination
  const [selectedResumes, setSelectedResumes] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // ── Persist view mode ──────────────────────────────────────────────────

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('resumeViewMode', mode);
    } catch {}
  }, []);

  // ── Get unique templates ───────────────────────────────────────────────

  const templates = useMemo(() => {
    const unique = new Set(resumes.map(r => r.template).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [resumes]);

  // ── FIXED: Reset page on filter change ────────────────────────────────

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterTemplate, filterScoreRange, sortBy, sortOrder]);

  // ── Filter & Sort (Memoized) ──────────────────────────────────────────

  const filteredResumes = useMemo(() => {
    let filtered = [...resumes];

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(resume =>
        resume.name?.toLowerCase().includes(term) ||
        resume.data?.personal?.fullName?.toLowerCase().includes(term) ||
        resume.data?.personal?.title?.toLowerCase().includes(term) ||
        resume.data?.personal?.email?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(resume => {
        if (filterStatus === 'completed') return resume.status === 'completed' || resume.atsScore >= 80;
        if (filterStatus === 'draft') return resume.status === 'draft' || (!resume.status && resume.atsScore < 80);
        return true;
      });
    }

    // Template filter
    if (filterTemplate !== 'all') {
      filtered = filtered.filter(resume => resume.template === filterTemplate);
    }

    // Score filter
    if (filterScoreRange !== 'all') {
      filtered = filtered.filter(resume => {
        const score = resume.atsScore || 0;
        if (filterScoreRange === 'excellent') return score >= 80;
        if (filterScoreRange === 'good') return score >= 60 && score < 80;
        if (filterScoreRange === 'needs-work') return score < 60;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'updatedAt':
        case 'createdAt':
          comparison = (a[sortBy] ? new Date(a[sortBy]).getTime() : 0) - (b[sortBy] ? new Date(b[sortBy]).getTime() : 0);
          break;
        case 'name':
          comparison = (a.name || 'Untitled').localeCompare(b.name || 'Untitled');
          break;
        case 'score':
          comparison = (a.atsScore || 0) - (b.atsScore || 0);
          break;
        case 'downloads':
          comparison = (a.downloadCount || 0) - (b.downloadCount || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [resumes, searchTerm, filterStatus, filterTemplate, filterScoreRange, sortBy, sortOrder]);

  // ── Pagination ─────────────────────────────────────────────────────────

  const totalPages = Math.ceil(filteredResumes.length / ITEMS_PER_PAGE);
  const paginatedResumes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResumes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResumes, currentPage]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const toggleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy]);

  const toggleSelectAll = useCallback(() => {
    if (selectedResumes.size === paginatedResumes.length) {
      setSelectedResumes(new Set());
      onSelectionChange?.([]);
    } else {
      const newSelected = new Set(paginatedResumes.map(r => r.id));
      setSelectedResumes(newSelected);
      onSelectionChange?.(Array.from(newSelected));
    }
  }, [selectedResumes.size, paginatedResumes, onSelectionChange]);

  const toggleSelectResume = useCallback((resumeId) => {
    setSelectedResumes(prev => {
      const next = new Set(prev);
      if (next.has(resumeId)) next.delete(resumeId);
      else next.add(resumeId);
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [onSelectionChange]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterTemplate('all');
    setFilterScoreRange('all');
    setSortBy('updatedAt');
    setSortOrder('desc');
  }, []);

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterTemplate !== 'all' || filterScoreRange !== 'all';

  // ── Loading State ──────────────────────────────────────────────────────

  if (loading) return <ListSkeleton />;

  // ── Error State ────────────────────────────────────────────────────────

  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <div className="space-y-6">
      {/* Search & Filters Bar */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, title, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
              aria-label="Search resumes"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear search"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2">
            {/* Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<FiFilter />}
              className="relative"
            >
              Filters
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full" />
              )}
            </Button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => toggleSort(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm"
              aria-label="Sort by"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortOrder === 'asc' ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />}
            </button>

            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-500'
                }`}
                aria-label="Grid view"
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-500'
                }`}
                aria-label="List view"
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Extended Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex flex-wrap items-end gap-4">
                <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus} options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'draft', label: 'Draft' },
                ]} />
                
                <FilterSelect label="Template" value={filterTemplate} onChange={setFilterTemplate} options={
                  templates.map(t => ({ value: t, label: t === 'all' ? 'All Templates' : t.charAt(0).toUpperCase() + t.slice(1) }))
                } />
                
                <FilterSelect label="ATS Score" value={filterScoreRange} onChange={setFilterScoreRange} options={[
                  { value: 'all', label: 'All Scores' },
                  { value: 'excellent', label: 'Excellent (80%+)' },
                  { value: 'good', label: 'Good (60-79%)' },
                  { value: 'needs-work', label: 'Needs Work (<60%)' },
                ]} />

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500">
                    Clear All
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing <span className="font-medium">{paginatedResumes.length}</span> of{' '}
          <span className="font-medium">{filteredResumes.length}</span> resumes
          {hasActiveFilters && ' (filtered)'}
        </p>
        {showSelection && paginatedResumes.length > 0 && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selectedResumes.size === paginatedResumes.length && paginatedResumes.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Select All
          </label>
        )}
      </div>

      {/* Content */}
      {filteredResumes.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} onClearFilters={clearFilters} onCreateResume={onCreateResume} />
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedResumes.map((resume, index) => (
                <motion.div
                  key={resume.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <ResumeCard
                    resume={resume}
                    onEdit={() => onEdit?.(resume)}
                    onDelete={() => onDelete?.(resume.id)}
                    onDuplicate={() => onDuplicate?.(resume)}
                    onDownload={() => onDownload?.(resume)}
                    onPreview={() => onPreview?.(resume)}
                    onShare={() => onShare?.(resume)}
                    selected={showSelection && selectedResumes.has(resume.id)}
                    onSelect={showSelection ? () => toggleSelectResume(resume.id) : undefined}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      ) : (
        <ListView
          resumes={paginatedResumes}
          showSelection={showSelection}
          selectedResumes={selectedResumes}
          sortBy={sortBy}
          sortOrder={sortOrder}
          toggleSort={toggleSort}
          toggleSelectAll={toggleSelectAll}
          toggleSelectResume={toggleSelectResume}
          onEdit={onEdit}
          onPreview={onPreview}
          onDownload={onDownload}
          onDuplicate={onDuplicate}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          filteredCount={filteredResumes.length}
        />
      )}
    </div>
  );
};

// ── Sub-Components ─────────────────────────────────────────────────────────

const FilterSelect = React.memo(({ label, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
));

const Pagination = React.memo(({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = useMemo(() => {
    const p = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) p.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) p.push(i);
      p.push('...');
      p.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      p.push(1);
      p.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) p.push(i);
    } else {
      p.push(1);
      p.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) p.push(i);
      p.push('...');
      p.push(totalPages);
    }
    return p;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <FiChevronLeft className="w-5 h-5" />
      </button>
      
      {pages.map((page, i) => (
        page === '...' ? (
          <span key={`dots-${i}`} className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-lg transition-colors ${
              currentPage === page ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <FiChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
});

const ListView = React.memo(({ 
  resumes, showSelection, selectedResumes,
  sortBy, sortOrder, toggleSort, toggleSelectAll, toggleSelectResume,
  onEdit, onPreview, onDownload, onDuplicate,
  currentPage, totalPages, onPageChange, filteredCount,
}) => (
  <div className="glass-card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {showSelection && (
              <th className="w-10 py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedResumes.size === resumes.length && resumes.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
            )}
            <SortableHeader label="Resume Name" field="name" {...{ sortBy, sortOrder, toggleSort }} />
            <SortableHeader label="Last Modified" field="updatedAt" {...{ sortBy, sortOrder, toggleSort }} />
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Template</th>
            <SortableHeader label="ATS Score" field="score" {...{ sortBy, sortOrder, toggleSort }} />
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {resumes.map((resume) => {
            const statusBadge = getStatusBadge(resume);
            return (
              <motion.tr
                key={resume.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {showSelection && (
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedResumes.has(resume.id)}
                      onChange={() => toggleSelectResume(resume.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                )}
                <td className="py-4 px-4">
                  <p className="font-medium text-sm">{resume.name || 'Untitled'}</p>
                  {resume.data?.personal?.fullName && (
                    <p className="text-xs text-gray-500">{resume.data.personal.fullName}</p>
                  )}
                </td>
                <td className="py-4 px-4 text-sm text-gray-500">
                  {resume.updatedAt 
                    ? formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })
                    : 'Never'}
                </td>
                <td className="py-4 px-4">
                  <Badge variant="secondary" size="sm" className="capitalize">{resume.template || 'Modern'}</Badge>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${resume.atsScore >= 80 ? 'text-green-500' : resume.atsScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {resume.atsScore || 0}%
                    </span>
                    <Progress value={resume.atsScore || 0} size="sm" className="w-16" color={getScoreVariant(resume.atsScore || 0)} />
                  </div>
                </td>
                <td className="py-4 px-4">
                  <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    {[
                      { onClick: onEdit, icon: null, label: 'Edit' },
                      { onClick: onPreview, icon: <FiEye className="w-4 h-4" />, label: 'Preview' },
                      { onClick: onDownload, icon: <FiDownload className="w-4 h-4" />, label: 'Download' },
                    ].map(({ onClick, icon, label }) => (
                      <Tooltip key={label} content={label}>
                        <button
                          onClick={() => onClick?.(resume)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                          aria-label={`${label} ${resume.name || 'resume'}`}
                        >
                          {icon || label}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {totalPages > 1 && (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500">
          Page {currentPage} of {totalPages} ({filteredCount} total)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )}
  </div>
));

const SortableHeader = React.memo(({ label, field, sortBy, sortOrder, toggleSort }) => (
  <th 
    className="text-left py-3 px-4 cursor-pointer hover:text-primary-500 transition-colors text-sm font-medium text-gray-500"
    onClick={() => toggleSort(field)}
  >
    <div className="flex items-center gap-1">
      {label}
      {sortBy === field && (
        sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
      )}
    </div>
  </th>
));

// ── Display Names ─────────────────────────────────────────────────────────

FilterSelect.displayName = 'FilterSelect';
Pagination.displayName = 'Pagination';
ListView.displayName = 'ListView';
SortableHeader.displayName = 'SortableHeader';

export default React.memo(ResumeList);