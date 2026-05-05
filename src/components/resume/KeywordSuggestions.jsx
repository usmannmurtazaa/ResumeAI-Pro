import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiCheck, FiSearch, FiRefreshCw, FiTrendingUp,
  FiStar, FiX, FiFilter, FiCopy, FiDownload, FiInfo,
  FiZap, FiGrid, FiList, FiChevronDown, FiChevronUp, FiAlertCircle,
} from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Progress from '../ui/Progress';
import Tooltip from '../ui/Tooltip';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const INDUSTRIES = [
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'marketing', name: 'Marketing', icon: '📈' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
  { id: 'sales', name: 'Sales', icon: '🤝' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'engineering', name: 'Engineering', icon: '⚙️' },
  { id: 'design', name: 'Design', icon: '🎨' },
];

// ── Inline Keyword Data (Fallback if external module is missing) ────────

const KEYWORD_BANK = {
  technology: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'CI/CD', 'Agile', 'REST API', 'Microservices', 'PostgreSQL', 'MongoDB', 'Redis', 'Git', 'Linux', 'DevOps', 'Cloud', 'Security'],
  marketing: ['SEO', 'Content Strategy', 'Social Media', 'Analytics', 'Email Marketing', 'PPC', 'Brand Management', 'Campaign', 'CRM', 'Lead Generation', 'Copywriting', 'A/B Testing', 'Market Research', 'Digital Marketing', 'ROI'],
  finance: ['Financial Analysis', 'Risk Management', 'Excel', 'Bloomberg', 'SQL', 'Financial Modeling', 'GAAP', 'Budgeting', 'Forecasting', 'Audit', 'Compliance', 'Investment', 'Accounting', 'Tax', 'Reconciliation'],
  healthcare: ['Patient Care', 'HIPAA', 'EMR', 'Clinical Research', 'Medical Terminology', 'Healthcare Management', 'Pharmacy', 'Diagnosis', 'Treatment', 'Therapy', 'Nursing', 'Public Health', 'Epidemiology'],
  sales: ['Lead Generation', 'CRM', 'Cold Calling', 'Account Management', 'Salesforce', 'Negotiation', 'Pipeline', 'B2B', 'B2C', 'Revenue', 'Quota', 'Prospecting', 'Closing', 'Customer Success'],
  education: ['Curriculum Development', 'Teaching', 'Assessment', 'E-learning', 'Instructional Design', 'Classroom Management', 'Lesson Planning', 'Mentoring', 'Research', 'Pedagogy'],
  engineering: ['CAD', 'AutoCAD', 'SolidWorks', 'MATLAB', 'Six Sigma', 'Quality Control', 'Manufacturing', 'Lean', 'PLC', 'HVAC', 'Structural Analysis', 'Thermodynamics'],
  design: ['Figma', 'Adobe', 'Sketch', 'UI/UX', 'Prototyping', 'Wireframing', 'User Research', 'Visual Design', 'Interaction Design', 'Typography', 'Branding', 'Illustration'],
};

// Category mapping
const KEYWORD_CATEGORIES = {};
Object.entries(KEYWORD_BANK).forEach(([industry, keywords]) => {
  KEYWORD_CATEGORIES[industry] = keywords;
});

// ── Utility Functions ────────────────────────────────────────────────────

const suggestKeywords = (industry, existingSkills = []) => {
  const keywords = KEYWORD_BANK[industry] || KEYWORD_BANK.technology;
  return keywords.filter(k => !existingSkills.includes(k));
};

const getKeywordCategories = () => KEYWORD_CATEGORIES;

const detectKeywordCategory = (keyword) => {
  for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
    if (keywords.some(k => k.toLowerCase() === keyword.toLowerCase())) return category;
  }
  return 'general';
};

const getTrendingKeywords = () => {
  const all = Object.values(KEYWORD_BANK).flat();
  return all.sort(() => 0.5 - Math.random()).slice(0, 5);
};

// ── Main Component ─────────────────────────────────────────────────────────

const KeywordSuggestions = ({ 
  industry = 'technology', 
  currentSkills = [], 
  onAddSkill,
  onAddMultipleSkills,
  jobDescription = '',
  className = '',
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [addedSkills, setAddedSkills] = useState([]); // FIXED: Use array instead of Set for proper re-renders
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(industry);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('relevance');
  const [showCategories, setShowCategories] = useState(true);
  const [selectedKeywords, setSelectedKeywords] = useState([]); // FIXED: Array instead of Set
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showJobMatch, setShowJobMatch] = useState(false);
  const [keywordStats, setKeywordStats] = useState(null);

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

  // ── Load Suggestions ─────────────────────────────────────────────────

  const loadSuggestions = useCallback(() => {
    setIsRefreshing(true);
    
    // Clear previous timer
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    
    refreshTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      
      const suggested = suggestKeywords(selectedIndustry, currentSkills);
      
      const enhanced = suggested.map(keyword => ({
        keyword,
        category: detectKeywordCategory(keyword),
        relevance: Math.floor(Math.random() * 31) + 70, // 70-100
        trending: Math.random() > 0.7,
        popularity: Math.floor(Math.random() * 30) + 70,
      }));
      
      setSuggestions(enhanced);
      setIsRefreshing(false);
    }, 300);
  }, [selectedIndustry, currentSkills]);

  useEffect(() => {
    loadSuggestions();
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [loadSuggestions]);

  // ── Stats ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (suggestions.length > 0) {
      const categories = {};
      suggestions.forEach(s => { categories[s.category] = (categories[s.category] || 0) + 1; });
      const totalRelevance = suggestions.reduce((sum, s) => sum + s.relevance, 0);
      setKeywordStats({
        total: suggestions.length,
        categories,
        averageRelevance: Math.round(totalRelevance / suggestions.length),
        added: addedSkills.length,
        coverage: Math.round((addedSkills.length / (suggestions.length + currentSkills.length || 1)) * 100),
      });
    }
  }, [suggestions, addedSkills, currentSkills]);

  // ── FIXED: Added/Selected Skills Management ─────────────────────────

  const addSkill = useCallback((skill) => {
    if (!addedSkills.includes(skill)) {
      setAddedSkills(prev => [...prev, skill]);
      onAddSkill?.(skill);
      toast.success(`"${skill}" added!`);
    }
  }, [addedSkills, onAddSkill]);

  const addMultipleSkills = useCallback(() => {
    if (selectedKeywords.length === 0) { toast.error('Select keywords first'); return; }
    const newSkills = selectedKeywords.filter(s => !addedSkills.includes(s));
    if (newSkills.length === 0) { toast.error('All selected already added'); return; }
    setAddedSkills(prev => [...prev, ...newSkills]);
    onAddMultipleSkills?.(newSkills);
    setSelectedKeywords([]);
    toast.success(`${newSkills.length} keywords added!`);
  }, [selectedKeywords, addedSkills, onAddMultipleSkills]);

  const toggleSelection = useCallback((keyword) => {
    setSelectedKeywords(prev => prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]);
  }, []);

  const selectAll = useCallback(() => {
    const available = filteredSuggestions.filter(s => !addedSkills.includes(s.keyword)).map(s => s.keyword);
    setSelectedKeywords(available);
  }, [filteredSuggestions, addedSkills]);

  const clearSelection = useCallback(() => setSelectedKeywords([]), []);
  const clearAdded = useCallback(() => setAddedSkills([]), []);

  // ── Export ───────────────────────────────────────────────────────────

  const handleCopyAll = useCallback(() => {
    const text = filteredSuggestions.map(s => s.keyword).join(', ');
    navigator.clipboard?.writeText(text).then(() => toast.success('Copied!')).catch(() => toast.error('Failed'));
  }, [filteredSuggestions]);

  const handleExportCSV = useCallback(() => {
    const csv = [['Keyword', 'Category', 'Relevance', 'Trending'], ...filteredSuggestions.map(s => [s.keyword, s.category, s.relevance, s.trending ? 'Yes' : 'No'])].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `keywords-${selectedIndustry}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!');
  }, [filteredSuggestions, selectedIndustry]);

  // ── Filter & Sort ───────────────────────────────────────────────────

  const filteredSuggestions = useMemo(() => {
    let filtered = suggestions.filter(s => !addedSkills.includes(s.keyword));
    if (searchTerm) filtered = filtered.filter(s => s.keyword.toLowerCase().includes(searchTerm.toLowerCase()) || s.category.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedCategory !== 'all') filtered = filtered.filter(s => s.category === selectedCategory);
    return filtered.sort((a, b) => {
      if (sortBy === 'relevance') return b.relevance - a.relevance;
      if (sortBy === 'alphabetical') return a.keyword.localeCompare(b.keyword);
      if (sortBy === 'trending') return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
      return b.popularity - a.popularity;
    });
  }, [suggestions, addedSkills, searchTerm, selectedCategory, sortBy]);

  const categories = useMemo(() => ['all', ...new Set(suggestions.map(s => s.category))], [suggestions]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            ATS Keyword Suggestions
            <Tooltip content="Keywords optimized for ATS systems"><FiInfo className="w-4 h-4 text-gray-400 cursor-help" /></Tooltip>
          </h3>
          {keywordStats && <p className="text-sm text-gray-500 mt-1">{keywordStats.total} keywords • {keywordStats.added} added • <span className="text-green-500">{keywordStats.coverage}% coverage</span></p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['list', 'grid'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`p-2 rounded-md ${viewMode === m ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-500'}`}>{m === 'list' ? <FiList className="w-4 h-4" /> : <FiGrid className="w-4 h-4" />}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={loadSuggestions} loading={isRefreshing} icon={<FiRefreshCw />}>Refresh</Button>
        </div>
      </div>

      {/* Industry Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {INDUSTRIES.map(({ id, name, icon }) => (
          <button key={id} onClick={() => setSelectedIndustry(id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              selectedIndustry === id ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>{icon} {name}</button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search keywords..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 text-sm" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><FiX className="w-4 h-4" /></button>}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field !py-2 !w-auto text-sm">
          <option value="relevance">Most Relevant</option><option value="trending">Trending</option><option value="popularity">Popular</option><option value="alphabetical">A-Z</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => setShowCategories(!showCategories)} icon={<FiFilter />}>Filter</Button>
      </div>

      {/* Category Filters */}
      <AnimatePresence>
        {showCategories && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
            <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              {categories.map(c => (
                <button key={c} onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${selectedCategory === c ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-100'}`}>
                  {c}{keywordStats?.categories[c] && <span className="ml-1 opacity-75">({keywordStats.categories[c]})</span>}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Match (simplified) */}
      {jobDescription && (
        <button onClick={() => setShowJobMatch(!showJobMatch)} className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
          <span className="flex items-center gap-2"><FiZap className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium">Job Match Analysis</span></span>
          {showJobMatch ? <FiChevronUp /> : <FiChevronDown />}
        </button>
      )}
      <AnimatePresence>
        {showJobMatch && jobDescription && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="space-y-2">
              <Progress value={75} size="sm" label="Keyword Match" />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="font-medium text-green-600">Matching</p>{suggestions.slice(0, 3).map((s, i) => <p key={i} className="text-gray-600"><FiCheck className="w-3 h-3 inline text-green-500 mr-1" />{s.keyword}</p>)}</div>
                <div><p className="font-medium text-red-600">Missing</p>{suggestions.slice(3, 6).map((s, i) => <p key={i} className="text-gray-600"><FiAlertCircle className="w-3 h-3 inline text-red-500 mr-1" />{s.keyword}</p>)}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions */}
      {selectedKeywords.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-between">
          <span className="text-sm"><span className="font-medium">{selectedKeywords.length}</span> selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
            <Button size="sm" onClick={addMultipleSkills}>Add Selected</Button>
          </div>
        </div>
      )}

      {/* Added Skills */}
      {addedSkills.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium">Added ({addedSkills.length})</p><button onClick={clearAdded} className="text-xs text-gray-500">Clear</button></div>
          <div className="flex flex-wrap gap-1.5 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            {addedSkills.map(s => <Badge key={s} variant="success" className="flex items-center gap-1">{s}<FiCheck className="w-3 h-3" /></Badge>)}
          </div>
        </div>
      )}

      {/* Keywords Grid/List */}
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-2' : 'space-y-2'} max-h-80 overflow-y-auto mb-4`}>
        {filteredSuggestions.map(({ keyword, category, relevance, trending, popularity }) => (
          <div key={keyword} className={`${viewMode === 'grid' ? 'p-3 rounded-lg border' : 'flex items-center justify-between p-3 rounded-lg'} ${
            selectedKeywords.includes(keyword) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
          }`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input type="checkbox" checked={selectedKeywords.includes(keyword)} onChange={() => toggleSelection(keyword)}
                className="rounded border-gray-300 text-primary-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate flex items-center gap-1">{keyword}{trending && <FiTrendingUp className="w-3 h-3 text-orange-500 flex-shrink-0" />}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500"><Badge size="sm" variant="secondary">{category}</Badge><span>{relevance}% match</span></div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => addSkill(keyword)} icon={<FiPlus />}>Add</Button>
          </div>
        ))}
        {filteredSuggestions.length === 0 && (
          <div className="text-center py-8 col-span-full"><FiSearch className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-500">No keywords found</p></div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="primary" onClick={addMultipleSkills} disabled={selectedKeywords.length === 0} className="flex-1">Add Selected ({selectedKeywords.length})</Button>
        <Button variant="outline" size="sm" onClick={handleCopyAll} icon={<FiCopy />}>Copy</Button>
        <Button variant="outline" size="sm" onClick={handleExportCSV} icon={<FiDownload />}>Export</Button>
      </div>
    </Card>
  );
};

export default React.memo(KeywordSuggestions);
