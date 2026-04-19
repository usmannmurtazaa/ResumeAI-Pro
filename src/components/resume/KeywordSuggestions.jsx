import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiCheck, 
  FiSearch, 
  FiRefreshCw,
  FiTrendingUp,
  FiStar,
  FiBookmark,
  FiX,
  FiFilter,
  FiCopy,
  FiDownload,
  FiInfo,
  FiZap,
  FiGrid,
  FiList,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle
} from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import Progress from '../ui/Progress';
import Tooltip from '../ui/Tooltip';
import Modal from '../ui/Modal';
import { 
  suggestKeywords, 
  industryKeywords, 
  getKeywordCategories,
  getKeywordTrends,
  calculateKeywordRelevance 
} from '../../utils/atsKeywords';
import toast from 'react-hot-toast';

const KeywordSuggestions = ({ 
  industry = 'technology', 
  currentSkills = [], 
  onAddSkill,
  onAddMultipleSkills,
  jobDescription = '',
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [addedSkills, setAddedSkills] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(industry);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance', 'alphabetical', 'trending'
  const [showCategories, setShowCategories] = useState(true);
  const [selectedKeywords, setSelectedKeywords] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showJobMatch, setShowJobMatch] = useState(false);
  const [keywordStats, setKeywordStats] = useState(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  // Load suggestions with enhanced logic
  useEffect(() => {
    loadSuggestions();
  }, [selectedIndustry, currentSkills, jobDescription]);

  // Calculate keyword statistics
  useEffect(() => {
    if (suggestions.length > 0) {
      calculateStats();
    }
  }, [suggestions]);

  const loadSuggestions = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Simulate async loading for smooth UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const suggested = suggestKeywords(selectedIndustry, currentSkills, jobDescription);
      
      // Enhance suggestions with metadata
      const enhancedSuggestions = suggested.map(keyword => ({
        keyword,
        category: detectKeywordCategory(keyword),
        relevance: calculateKeywordRelevance(keyword, selectedIndustry, jobDescription),
        trending: Math.random() > 0.5, // Simulate trending data
        popularity: Math.floor(Math.random() * 30) + 70, // 70-100 popularity score
        difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)]
      }));
      
      setSuggestions(enhancedSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast.error('Failed to load keyword suggestions');
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedIndustry, currentSkills, jobDescription]);

  const calculateStats = () => {
    const categories = {};
    let totalRelevance = 0;
    
    suggestions.forEach(({ category, relevance }) => {
      categories[category] = (categories[category] || 0) + 1;
      totalRelevance += relevance;
    });
    
    setKeywordStats({
      total: suggestions.length,
      categories,
      averageRelevance: Math.round(totalRelevance / suggestions.length),
      added: addedSkills.size,
      coverage: Math.round((addedSkills.size / (suggestions.length + currentSkills.length)) * 100)
    });
  };

  const detectKeywordCategory = (keyword) => {
    const categories = getKeywordCategories();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(k => k.toLowerCase() === keyword.toLowerCase())) {
        return category;
      }
    }
    return 'general';
  };

  const handleAddSkill = (skill) => {
    onAddSkill?.(skill);
    setAddedSkills(prev => new Set([...prev, skill]));
    toast.success(`"${skill}" added to your skills`);
  };

  const handleAddMultipleSkills = () => {
    const skillsToAdd = Array.from(selectedKeywords);
    if (skillsToAdd.length === 0) {
      toast.error('Please select keywords to add');
      return;
    }
    
    onAddMultipleSkills?.(skillsToAdd);
    skillsToAdd.forEach(skill => addedSkills.add(skill));
    setAddedSkills(new Set(addedSkills));
    setSelectedKeywords(new Set());
    toast.success(`${skillsToAdd.length} keywords added successfully!`);
  };

  const handleCopyAll = () => {
    const allKeywords = filteredSuggestions.map(s => s.keyword).join(', ');
    navigator.clipboard?.writeText(allKeywords);
    toast.success('All keywords copied to clipboard!');
  };

  const handleExportCSV = () => {
    const csv = [
      ['Keyword', 'Category', 'Relevance', 'Trending', 'Popularity'],
      ...filteredSuggestions.map(s => [
        s.keyword,
        s.category,
        s.relevance,
        s.trending ? 'Yes' : 'No',
        s.popularity
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${selectedIndustry}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Keywords exported to CSV');
  };

  const toggleKeywordSelection = (keyword) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
  };

  const selectAllKeywords = () => {
    const availableKeywords = filteredSuggestions
      .filter(s => !addedSkills.has(s.keyword))
      .map(s => s.keyword);
    setSelectedKeywords(new Set(availableKeywords));
  };

  const clearSelection = () => {
    setSelectedKeywords(new Set());
  };

  // Filter and sort suggestions
  const filteredSuggestions = useMemo(() => {
    let filtered = suggestions;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(({ keyword, category }) =>
        keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(({ category }) => category === selectedCategory);
    }
    
    // Filter out already added skills
    filtered = filtered.filter(({ keyword }) => !addedSkills.has(keyword));
    
    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevance - a.relevance;
        case 'alphabetical':
          return a.keyword.localeCompare(b.keyword);
        case 'trending':
          return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
        case 'popularity':
          return b.popularity - a.popularity;
        default:
          return 0;
      }
    });
  }, [suggestions, searchTerm, selectedCategory, addedSkills, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(suggestions.map(s => s.category));
    return ['all', ...Array.from(cats)];
  }, [suggestions]);

  const industries = [
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'marketing', name: 'Marketing', icon: '📈' },
    { id: 'finance', name: 'Finance', icon: '💰' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'sales', name: 'Sales', icon: '🤝' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'engineering', name: 'Engineering', icon: '⚙️' },
    { id: 'design', name: 'Design', icon: '🎨' },
    { id: 'consulting', name: 'Consulting', icon: '💡' }
  ];

  const getRelevanceColor = (relevance) => {
    if (relevance >= 80) return 'text-green-500';
    if (relevance >= 60) return 'text-yellow-500';
    return 'text-gray-400';
  };

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            ATS Keyword Suggestions
            <Tooltip content="These keywords are optimized for ATS systems and increase your resume's visibility">
              <FiInfo className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </h3>
          {keywordStats && (
            <p className="text-sm text-gray-500 mt-1">
              {keywordStats.total} keywords available • {keywordStats.added} added • 
              <span className="text-green-500 ml-1">{keywordStats.coverage}% coverage</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' 
                  : 'text-gray-500'
              }`}
            >
              <FiList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' 
                  : 'text-gray-500'
              }`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
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
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Industry Focus</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {industries.map(({ id, name, icon }) => (
            <button
              key={id}
              onClick={() => setSelectedIndustry(id)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all
                flex items-center justify-center gap-2
                ${selectedIndustry === id
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{name}</span>
              <span className="sm:hidden">{name.slice(0, 4)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search keywords or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 
                     bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 
                     bg-white/50 dark:bg-gray-800/50 text-sm"
          >
            <option value="relevance">Most Relevant</option>
            <option value="trending">Trending</option>
            <option value="popularity">Most Popular</option>
            <option value="alphabetical">A-Z</option>
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
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all
                    ${selectedCategory === category
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {category}
                  {keywordStats?.categories[category] && (
                    <span className="ml-1 opacity-75">
                      ({keywordStats.categories[category]})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Match Analysis */}
      {jobDescription && (
        <div className="mb-4">
          <button
            onClick={() => setShowJobMatch(!showJobMatch)}
            className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <FiZap className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Job Description Match Analysis</span>
            </div>
            {showJobMatch ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          
          <AnimatePresence>
            {showJobMatch && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Keyword Match</span>
                      <span className="font-medium">75%</span>
                    </div>
                    <Progress value={75} size="sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium text-green-600 mb-1">Matching Keywords</p>
                      <ul className="space-y-1">
                        {suggestions.slice(0, 3).map((s, i) => (
                          <li key={i} className="flex items-center gap-1 text-gray-600">
                            <FiCheck className="w-3 h-3 text-green-500" />
                            {s.keyword}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-red-600 mb-1">Missing Keywords</p>
                      <ul className="space-y-1">
                        {suggestions.slice(3, 6).map((s, i) => (
                          <li key={i} className="flex items-center gap-1 text-gray-600">
                            <FiAlertCircle className="w-3 h-3 text-red-500" />
                            {s.keyword}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedKeywords.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-between"
        >
          <span className="text-sm">
            <span className="font-medium">{selectedKeywords.size}</span> keywords selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
            <Button size="sm" onClick={handleAddMultipleSkills}>
              Add Selected
            </Button>
          </div>
        </motion.div>
      )}

      {/* Added Skills Section */}
      {addedSkills.size > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Added Keywords ({addedSkills.size})</p>
            <button
              onClick={() => setAddedSkills(new Set())}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            {Array.from(addedSkills).map((skill, index) => (
              <motion.div
                key={skill}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Badge variant="success" className="flex items-center gap-1">
                  {skill}
                  <FiCheck className="w-3 h-3" />
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">
            Recommended Keywords ({filteredSuggestions.length})
          </p>
          <div className="flex gap-2">
            <Tooltip content="Select all visible keywords">
              <button
                onClick={selectAllKeywords}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Select All
              </button>
            </Tooltip>
            <Tooltip content="Copy all to clipboard">
              <button onClick={handleCopyAll} className="text-gray-400 hover:text-gray-600">
                <FiCopy className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Export as CSV">
              <button onClick={handleExportCSV} className="text-gray-400 hover:text-gray-600">
                <FiDownload className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-2 sm:grid-cols-3 gap-2' 
            : 'space-y-2'
          }
          max-h-96 overflow-y-auto custom-scrollbar
        `}>
          <AnimatePresence>
            {filteredSuggestions.map(({ keyword, category, relevance, trending, popularity }, index) => (
              <motion.div
                key={keyword}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.02 }}
                className={`
                  ${viewMode === 'grid'
                    ? 'p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all'
                    : 'flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg'
                  }
                  ${selectedKeywords.has(keyword) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300' : ''}
                `}
              >
                {viewMode === 'grid' ? (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedKeywords.has(keyword)}
                          onChange={() => toggleKeywordSelection(keyword)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="font-medium text-sm">{keyword}</span>
                      </div>
                      {trending && (
                        <FiTrendingUp className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge size="sm" variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${getRelevanceColor(relevance)}`}>
                          {relevance}% match
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddSkill(keyword)}
                          icon={<FiPlus />}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedKeywords.has(keyword)}
                        onChange={() => toggleKeywordSelection(keyword)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{keyword}</span>
                          {trending && (
                            <Tooltip content="Trending keyword">
                              <FiTrendingUp className="w-3 h-3 text-orange-500" />
                            </Tooltip>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge size="sm" variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                          <span className={`text-xs ${getRelevanceColor(relevance)}`}>
                            {relevance}% relevant
                          </span>
                          <span className="text-xs text-gray-400">
                            Popularity: {popularity}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddSkill(keyword)}
                      icon={<FiPlus />}
                    >
                      Add
                    </Button>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredSuggestions.length === 0 && (
            <div className="text-center py-8">
              <FiSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No keywords found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="primary"
          onClick={handleAddMultipleSkills}
          disabled={selectedKeywords.size === 0}
          className="flex-1"
        >
          Add Selected ({selectedKeywords.size})
        </Button>
        <Button
          variant="outline"
          onClick={loadSuggestions}
          loading={isRefreshing}
        >
          Refresh
        </Button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
      `}</style>
    </Card>
  );
};

export default React.memo(KeywordSuggestions);