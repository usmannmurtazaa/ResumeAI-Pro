import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiFilter, 
  FiGrid, 
  FiList, 
  FiArrowUp, 
  FiArrowDown,
  FiX,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiTrendingUp,
  FiDownload,
  FiEye,
  FiMoreVertical,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiStar,
  FiBookmark,
  FiTag
} from 'react-icons/fi';
import ResumeCard from './ResumeCard';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Progress from '../ui/Progress';
import Tooltip from '../ui/Tooltip';
import { format, formatDistanceToNow } from 'date-fns';

const ResumeList = ({ 
  resumes = [], 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onDownload,
  onPreview,
  onShare,
  loading = false,
  showSelection = false,
  onSelectionChange
}) => {
  const [viewMode, setViewMode] = useState(() => {
    // Persist view preference
    return localStorage.getItem('resumeViewMode') || 'grid';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTemplate, setFilterTemplate] = useState('all');
  const [filterScoreRange, setFilterScoreRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResumes, setSelectedResumes] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Persist view mode preference
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('resumeViewMode', mode);
  };

  // Get unique templates for filter
  const templates = useMemo(() => {
    const unique = new Set(resumes.map(r => r.template).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [resumes]);

  const filterResumes = useCallback(() => {
    let filtered = [...resumes];

    // Search filter
    if (searchTerm) {
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

    // Score range filter
    if (filterScoreRange !== 'all') {
      filtered = filtered.filter(resume => {
        const score = resume.atsScore || 0;
        if (filterScoreRange === 'excellent') return score >= 80;
        if (filterScoreRange === 'good') return score >= 60 && score < 80;
        if (filterScoreRange === 'needs-work') return score < 60;
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'updatedAt':
        case 'createdAt':
          const aDate = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
          const bDate = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
          comparison = aDate - bDate;
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

  const filteredResumes = filterResumes();
  
  // Pagination
  const totalPages = Math.ceil(filteredResumes.length / itemsPerPage);
  const paginatedResumes = filteredResumes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterTemplate, filterScoreRange]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedResumes.size === paginatedResumes.length) {
      setSelectedResumes(new Set());
      onSelectionChange?.([]);
    } else {
      const newSelected = new Set(paginatedResumes.map(r => r.id));
      setSelectedResumes(newSelected);
      onSelectionChange?.(Array.from(newSelected));
    }
  };

  const toggleSelectResume = (resumeId) => {
    const newSelected = new Set(selectedResumes);
    if (newSelected.has(resumeId)) {
      newSelected.delete(resumeId);
    } else {
      newSelected.add(resumeId);
    }
    setSelectedResumes(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterTemplate('all');
    setFilterScoreRange('all');
    setSortBy('updatedAt');
    setSortOrder('desc');
  };

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterTemplate !== 'all' || filterScoreRange !== 'all';

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (resume) => {
    const status = resume.status || (resume.atsScore >= 80 ? 'completed' : 'draft');
    return {
      completed: { variant: 'success', label: 'Completed', icon: <FiCheckCircle className="w-3 h-3" /> },
      draft: { variant: 'warning', label: 'Draft', icon: <FiClock className="w-3 h-3" /> }
    }[status] || { variant: 'secondary', label: status, icon: null };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="glass-card p-4">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, title, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              icon={<FiFilter />}
              className="relative"
            >
              Filters
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full" />
              )}
            </Button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => toggleSort(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm"
            >
              <option value="updatedAt">Last Modified</option>
              <option value="createdAt">Date Created</option>
              <option value="name">Name</option>
              <option value="score">ATS Score</option>
              <option value="downloads">Downloads</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />}
            </button>

            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Grid view"
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="List view"
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Extended Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Template</label>
                  <select
                    value={filterTemplate}
                    onChange={(e) => setFilterTemplate(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm capitalize"
                  >
                    {templates.map(t => (
                      <option key={t} value={t} className="capitalize">{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ATS Score</label>
                  <select
                    value={filterScoreRange}
                    onChange={(e) => setFilterScoreRange(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm"
                  >
                    <option value="all">All Scores</option>
                    <option value="excellent">Excellent (80%+)</option>
                    <option value="good">Good (60-79%)</option>
                    <option value="needs-work">Needs Work (&lt;60%)</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-red-500 hover:text-red-600"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium">{paginatedResumes.length}</span> of{' '}
          <span className="font-medium">{filteredResumes.length}</span> resumes
          {hasActiveFilters && ' (filtered)'}
        </p>
        
        {showSelection && paginatedResumes.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedResumes.size === paginatedResumes.length}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Select All
          </label>
        )}
      </div>

      {/* Resume Display */}
      {filteredResumes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiSearch className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No resumes found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your filters or search terms'
              : 'Create your first resume to get started'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </motion.div>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary-500 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="w-10 h-10 flex items-center justify-center">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  {showSelection && (
                    <th className="w-10 py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedResumes.size === paginatedResumes.length && paginatedResumes.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                  )}
                  <th 
                    className="text-left py-3 px-4 cursor-pointer hover:text-primary-500 transition-colors"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Resume Name
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 cursor-pointer hover:text-primary-500 transition-colors"
                    onClick={() => toggleSort('updatedAt')}
                  >
                    <div className="flex items-center gap-1">
                      Last Modified
                      {sortBy === 'updatedAt' && (
                        sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4">Template</th>
                  <th 
                    className="text-left py-3 px-4 cursor-pointer hover:text-primary-500 transition-colors"
                    onClick={() => toggleSort('score')}
                  >
                    <div className="flex items-center gap-1">
                      ATS Score
                      {sortBy === 'score' && (
                        sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {paginatedResumes.map((resume) => {
                    const statusBadge = getStatusBadge(resume);
                    
                    return (
                      <motion.tr
                        key={resume.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
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
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {resume.name || 'Untitled'}
                            </p>
                            {resume.data?.personal?.fullName && (
                              <p className="text-sm text-gray-500">{resume.data.personal.fullName}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Tooltip content={resume.updatedAt ? format(new Date(resume.updatedAt), 'PPP p') : 'Never'}>
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <FiCalendar className="w-3.5 h-3.5" />
                              <span className="text-sm">
                                {resume.updatedAt 
                                  ? formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })
                                  : 'Never'}
                              </span>
                            </div>
                          </Tooltip>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="secondary" size="sm" className="capitalize">
                            {resume.template || 'Modern'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${getScoreColor(resume.atsScore || 0)}`}>
                              {resume.atsScore || 0}%
                            </span>
                            <Progress 
                              value={resume.atsScore || 0} 
                              size="sm" 
                              className="w-16"
                              color={resume.atsScore >= 80 ? 'success' : resume.atsScore >= 60 ? 'warning' : 'danger'}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={statusBadge.variant} size="sm" className="flex items-center gap-1 w-fit">
                            {statusBadge.icon}
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <Tooltip content="Edit">
                              <button
                                onClick={() => onEdit?.(resume)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                Edit
                              </button>
                            </Tooltip>
                            <Tooltip content="Preview">
                              <button
                                onClick={() => onPreview?.(resume)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Download">
                              <button
                                onClick={() => onDownload?.(resume)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                <FiDownload className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Duplicate">
                              <button
                                onClick={() => onDuplicate?.(resume)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                <FiBookmark className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination for List View */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredResumes.length)} of {filteredResumes.length} resumes
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeList;