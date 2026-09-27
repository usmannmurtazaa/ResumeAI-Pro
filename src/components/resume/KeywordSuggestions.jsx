import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiCheck,
  FiSearch,
  FiRefreshCw,
  FiTrendingUp,
  FiX,
  FiFilter,
  FiCopy,
  FiDownload,
  FiInfo,
  FiGrid,
  FiList,
  FiTarget,
} from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';
import { suggestKeywords, calculateKeywordRelevance } from '../../utils/atsKeywords';
import { INDUSTRIES } from '../../data/constants';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const PRIORITY_LEVELS = [
  { value: 'high', label: 'High Priority', color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  {
    value: 'medium',
    label: 'Medium Priority',
    color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  },
  { value: 'low', label: 'Low Priority', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
];

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Main Component ─────────────────────────────────────────────────────────

const KeywordSuggestions = ({
  industry = 'technology',
  currentSkills = [],
  onAddSkill,
  onAddMultipleSkills,
  jobDescription = '',
  jobRole = '',
  className = '',
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [addedSkills, setAddedSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(industry);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('relevance');
  const [showCategories, setShowCategories] = useState(true);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [keywordStats, setKeywordStats] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('all');

  const mountedRef = useRef(true);
  const refreshTimerRef = useRef(null);

  // ── Lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // ── Keyword Category Detection ──────────────────────────────────────

  const detectKeywordCategory = useCallback((keyword) => {
    const lower = keyword.toLowerCase();
    const technicalKeywords = [
      'javascript',
      'python',
      'java',
      'react',
      'node',
      'aws',
      'docker',
      'kubernetes',
      'sql',
      'mongodb',
      'typescript',
      'go',
      'rust',
      'ruby',
      'php',
      'swift',
      'kotlin',
      'angular',
      'vue',
      'next',
      'graphql',
      'rest',
      'api',
      'ci/cd',
      'devops',
      'terraform',
      'git',
      'linux',
    ];
    const softKeywords = [
      'leadership',
      'communication',
      'teamwork',
      'problem solving',
      'critical thinking',
      'time management',
      'project management',
      'adaptability',
      'creativity',
      'collaboration',
      'mentoring',
      'negotiation',
      'presentation',
      'public speaking',
      'analytical',
    ];
    if (technicalKeywords.some((t) => lower.includes(t))) return 'technical';
    if (softKeywords.some((s) => lower.includes(s))) return 'soft';
    return 'industry';
  }, []);

  // ── Load Suggestions ─────────────────────────────────────────────────

  const loadSuggestions = useCallback(() => {
    setIsRefreshing(true);

    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    refreshTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      const suggested = suggestKeywords(selectedIndustry, currentSkills, jobDescription);

      const enhanced = suggested.map((keyword) => {
        const relevance = calculateKeywordRelevance(keyword, selectedIndustry, jobDescription);
        const category = detectKeywordCategory(keyword);
        const priority = relevance >= 80 ? 'high' : relevance >= 60 ? 'medium' : 'low';
        return {
          keyword,
          category,
          relevance,
          priority,
          trending: Math.random() > 0.7,
          popularity: Math.floor(Math.random() * 30) + 70,
        };
      });

      setSuggestions(enhanced);
      setIsRefreshing(false);
    }, 300);
  }, [selectedIndustry, currentSkills, jobDescription, detectKeywordCategory]);

  useEffect(() => {
    loadSuggestions();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [loadSuggestions]);

  // ── Filtered Suggestions ─────────────────────────────────────────────
  // Declared above the callbacks that consume it. This prevents the
  // temporal-dead-zone error that previously crashed the component.

  const filteredSuggestions = useMemo(() => {
    let filtered = suggestions.filter((s) => !addedSkills.includes(s.keyword));

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) => s.keyword.toLowerCase().includes(term) || s.category.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((s) => s.priority === priorityFilter);
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'relevance') return b.relevance - a.relevance;
      if (sortBy === 'alphabetical') return a.keyword.localeCompare(b.keyword);
      if (sortBy === 'trending') return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
      if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] || 0) - (order[b.priority] || 0);
      }
      return b.popularity - a.popularity;
    });
  }, [suggestions, addedSkills, searchTerm, selectedCategory, priorityFilter, sortBy]);

  const categories = useMemo(() => {
    const unique = new Set(suggestions.map((s) => s.category));
    return ['all', ...Array.from(unique)];
  }, [suggestions]);

  // ── Stats ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (suggestions.length > 0) {
      const categoryCounts = {};
      const priorities = { high: 0, medium: 0, low: 0 };
      suggestions.forEach((s) => {
        categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
        priorities[s.priority] = (priorities[s.priority] || 0) + 1;
      });
      const totalRelevance = suggestions.reduce((sum, s) => sum + s.relevance, 0);
      setKeywordStats({
        total: suggestions.length,
        categories: categoryCounts,
        priorities,
        averageRelevance: Math.round(totalRelevance / suggestions.length),
        added: addedSkills.length,
        coverage: Math.round(
          (addedSkills.length / (suggestions.length + currentSkills.length || 1)) * 100
        ),
      });
    }
  }, [suggestions, addedSkills, currentSkills]);

  // ── Added/Selected Skills Management ──────────────────────────────

  const addSkill = useCallback(
    (skill) => {
      if (!addedSkills.includes(skill)) {
        setAddedSkills((prev) => [...prev, skill]);
        onAddSkill?.(skill);
        toast.success(`"${skill}" added!`);
      }
    },
    [addedSkills, onAddSkill]
  );

  const addMultipleSkills = useCallback(() => {
    if (selectedKeywords.length === 0) {
      toast.error('Select keywords first');
      return;
    }
    const newSkills = selectedKeywords.filter((s) => !addedSkills.includes(s));
    if (newSkills.length === 0) {
      toast.error('All selected already added');
      return;
    }
    setAddedSkills((prev) => [...prev, ...newSkills]);
    onAddMultipleSkills?.(newSkills);
    setSelectedKeywords([]);
    toast.success(`${newSkills.length} keywords added!`);
  }, [selectedKeywords, addedSkills, onAddMultipleSkills]);

  const toggleSelection = useCallback((keyword) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedKeywords([]), []);
  const clearAdded = useCallback(() => setAddedSkills([]), []);

  // ── Export ───────────────────────────────────────────────────────────

  const handleCopyAll = useCallback(() => {
    const text = filteredSuggestions.map((s) => s.keyword).join(', ');
    navigator.clipboard
      ?.writeText(text)
      .then(() => toast.success('Copied!'))
      .catch(() => toast.error('Failed'));
  }, [filteredSuggestions]);

  const handleExportCSV = useCallback(() => {
    const csv = [
      ['Keyword', 'Category', 'Relevance', 'Priority', 'Trending'],
      ...filteredSuggestions.map((s) => [
        s.keyword,
        s.category,
        s.relevance,
        s.priority,
        s.trending ? 'Yes' : 'No',
      ]),
    ]
      .map((r) => r.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${selectedIndustry}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!');
  }, [filteredSuggestions, selectedIndustry]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
            <FiTarget className="w-5 h-5 text-primary-500" />
            ATS Keyword Suggestions
            <Tooltip content="Keywords optimized for ATS systems">
              <FiInfo className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </h3>
          {keywordStats && (
            <p className="text-sm text-gray-500 mt-1">
              {keywordStats.total} keywords • {keywordStats.added} added •{' '}
              <span className="text-green-500">{keywordStats.coverage}% coverage</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['list', 'grid'].map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={cn(
                  'p-2 rounded-md',
                  viewMode === m
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600'
                    : 'text-gray-500'
                )}
                aria-label={`${m} view`}
              >
                {m === 'list' ? <FiList className="w-4 h-4" /> : <FiGrid className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSuggestions}
            loading={isRefreshing}
            icon={<FiRefreshCw />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Industry Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {INDUSTRIES.slice(0, 8).map((ind) => (
          <button
            key={ind}
            onClick={() => setSelectedIndustry(ind.toLowerCase())}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-all',
              selectedIndustry === ind.toLowerCase()
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            )}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input-field !py-2 !w-auto text-sm"
        >
          <option value="relevance">Most Relevant</option>
          <option value="priority">Priority</option>
          <option value="trending">Trending</option>
          <option value="popularity">Popular</option>
          <option value="alphabetical">A-Z</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="input-field !py-2 !w-auto text-sm"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCategories(!showCategories)}
          icon={<FiFilter />}
        >
          Filter
        </Button>
      </div>

      {/* Category Filters */}
      <AnimatePresence>
        {showCategories && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium capitalize',
                    selectedCategory === c
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  )}
                >
                  {c}
                  {keywordStats?.categories[c] && (
                    <span className="ml-1 opacity-75">({keywordStats.categories[c]})</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Priority Legend */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <span className="text-gray-500">Priority:</span>
        {PRIORITY_LEVELS.map((p) => (
          <span key={p.value} className={cn('px-2 py-0.5 rounded-full', p.color)}>
            {p.label}
          </span>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedKeywords.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-between">
          <span className="text-sm">
            <span className="font-medium">{selectedKeywords.length}</span> selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
            <Button size="sm" onClick={addMultipleSkills}>
              Add Selected
            </Button>
          </div>
        </div>
      )}

      {/* Added Skills */}
      {addedSkills.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Added ({addedSkills.length})
            </p>
            <button
              onClick={clearAdded}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            {addedSkills.map((s) => (
              <Badge key={s} variant="success" className="flex items-center gap-1">
                {s}
                <FiCheck className="w-3 h-3" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Keywords Grid/List */}
      <div
        className={cn(
          viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-2' : 'space-y-2',
          'max-h-80 overflow-y-auto mb-4'
        )}
      >
        {filteredSuggestions.map(
          ({ keyword, category, relevance, priority, trending, popularity }) => {
            const priorityConfig = PRIORITY_LEVELS.find((p) => p.value === priority);
            return (
              <div
                key={keyword}
                className={cn(
                  viewMode === 'grid'
                    ? 'p-3 rounded-lg border'
                    : 'flex items-center justify-between p-3 rounded-lg',
                  selectedKeywords.includes(keyword)
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedKeywords.includes(keyword)}
                    onChange={() => toggleSelection(keyword)}
                    className="rounded border-gray-300 text-primary-600 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate flex items-center gap-1">
                      {keyword}
                      {trending && (
                        <FiTrendingUp className="w-3 h-3 text-orange-500 flex-shrink-0" />
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge size="sm" variant="secondary" className="capitalize">
                        {category}
                      </Badge>
                      <span>{relevance}% match</span>
                      {priorityConfig && (
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded-full text-[10px]',
                            priorityConfig.color
                          )}
                        >
                          {priorityConfig.label.replace(' Priority', '')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addSkill(keyword)}
                  icon={<FiPlus />}
                  className="flex-shrink-0"
                />
              </div>
            );
          }
        )}
        {filteredSuggestions.length === 0 && (
          <div className="text-center py-8 col-span-full">
            <FiSearch className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No keywords found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="primary"
          onClick={addMultipleSkills}
          disabled={selectedKeywords.length === 0}
          className="flex-1"
        >
          Add Selected ({selectedKeywords.length})
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyAll} icon={<FiCopy />}>
          Copy
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportCSV} icon={<FiDownload />}>
          Export
        </Button>
      </div>
    </Card>
  );
};

export default React.memo(KeywordSuggestions);
