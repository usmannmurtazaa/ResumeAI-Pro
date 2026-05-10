import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiX, FiFileText, FiLayout, FiBookOpen,
  FiHelpCircle, FiArrowRight, FiClock, FiTrendingUp,
  FiCornerDownLeft, FiArrowUp, FiArrowDown, FiMic,
  FiLoader
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// ── Constants ───────────────────────────────────────────────────────────────
const MAX_RESULTS = 8;
const DEBOUNCE_DELAY = 200;
const MAX_RECENT_SEARCHES = 5;
const MIN_SEARCH_LENGTH = 1;

// ── Search Result Types ────────────────────────────────────────────────────

/**
 * Predefined searchable items in your app.
 * Extend this with your actual routes and content.
 */
const SEARCH_INDEX = [
  // Pages
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: FiTrendingUp, category: 'Pages', keywords: ['home', 'main', 'overview'] },
  { id: 'builder', label: 'Resume Builder', path: '/builder', icon: FiFileText, category: 'Pages', keywords: ['create', 'build', 'new resume'] },
  { id: 'templates', label: 'Templates', path: '/templates', icon: FiLayout, category: 'Pages', keywords: ['designs', 'layouts', 'themes'] },
  { id: 'ats-scanner', label: 'ATS Scanner', path: '/ats-scanner', icon: FiTrendingUp, category: 'Tools', keywords: ['scan', 'score', 'optimize', 'ats'] },
  { id: 'pricing', label: 'Pricing', path: '/pricing', icon: FiLayout, category: 'Pages', keywords: ['plans', 'upgrade', 'premium', 'cost'] },
  { id: 'blog', label: 'Blog', path: '/blog', icon: FiBookOpen, category: 'Content', keywords: ['articles', 'tips', 'career'] },
  { id: 'help', label: 'Help Center', path: '/help', icon: FiHelpCircle, category: 'Support', keywords: ['support', 'faq', 'docs', 'guide'] },
  { id: 'profile', label: 'Profile', path: '/profile', icon: FiFileText, category: 'Account', keywords: ['account', 'settings', 'personal'] },
  { id: 'settings', label: 'Settings', path: '/settings', icon: FiFileText, category: 'Account', keywords: ['preferences', 'config', 'options'] },
  { id: 'my-resumes', label: 'My Resumes', path: '/my-resumes', icon: FiFileText, category: 'Pages', keywords: ['documents', 'files', 'saved'] },
  
  // Quick Actions
  { id: 'action-new-resume', label: 'Create New Resume', path: '/builder', icon: FiFileText, category: 'Actions', keywords: ['new', 'create', 'start'], isAction: true },
  { id: 'action-templates', label: 'Browse Templates', path: '/templates', icon: FiLayout, category: 'Actions', keywords: ['browse', 'explore'], isAction: true },
  { id: 'action-upgrade', label: 'Upgrade to Pro', path: '/pricing', icon: FiTrendingUp, category: 'Actions', keywords: ['upgrade', 'pro', 'premium'], isAction: true, premium: true },
];

// ── Custom Hook: Recent Searches ───────────────────────────────────────────

const useRecentSearches = () => {
  const [recent, setRecent] = useState(() => {
    try {
      const saved = localStorage.getItem('recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addRecent = useCallback((query) => {
    if (!query.trim()) return;
    
    setRecent(prev => {
      const updated = [query, ...prev.filter(s => s !== query)].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem('recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem('recent_searches');
    } catch {}
  }, []);

  return { recent, addRecent, clearRecent };
};

// ── Custom Hook: Debounce ──────────────────────────────────────────────────

const useDebounce = (value, delay = DEBOUNCE_DELAY) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// ── Component ──────────────────────────────────────────────────────────────

const SearchBar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const { recent, addRecent, clearRecent } = useRecentSearches();
  
  const debouncedQuery = useDebounce(query);

  // ── Focus Management ──────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // ── Voice Search Listener ─────────────────────────────────────────────

  useEffect(() => {
    const handleVoiceSearch = (event) => {
      if (isOpen && event.detail) {
        setQuery(event.detail);
        inputRef.current?.focus();
      }
    };

    window.addEventListener('voice-search', handleVoiceSearch);
    return () => window.removeEventListener('voice-search', handleVoiceSearch);
  }, [isOpen]);

  // ── Filter Results ────────────────────────────────────────────────────

  const results = useMemo(() => {
    const term = debouncedQuery.toLowerCase().trim();
    
    if (!term || term.length < MIN_SEARCH_LENGTH) return [];
    
    return SEARCH_INDEX
      .filter(item => {
        const searchable = [
          item.label,
          item.category,
          ...(item.keywords || []),
        ].join(' ').toLowerCase();
        
        return searchable.includes(term);
      })
      .slice(0, MAX_RESULTS);
  }, [debouncedQuery]);

  const showResults = results.length > 0;
  const showRecent = !debouncedQuery && recent.length > 0;
  const showEmpty = debouncedQuery && debouncedQuery.length >= MIN_SEARCH_LENGTH && results.length === 0;

  // ── Keyboard Navigation ───────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const listItems = results.length > 0 ? results : (showRecent ? recent : []);
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, listItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          } else if (showRecent && recent[selectedIndex]) {
            setQuery(recent[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results, recent, showRecent]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleSelect = useCallback((item) => {
    addRecent(query || item.label);
    onClose();
    
    setTimeout(() => {
      navigate(item.path);
    }, 150);
  }, [query, addRecent, onClose, navigate]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (query.trim()) {
      // Navigate to a generic search page or fallback
      addRecent(query);
      onClose();
      navigate(`/templates?q=${encodeURIComponent(query.trim())}`);
    }
  }, [results, selectedIndex, query, handleSelect, addRecent, onClose, navigate]);

  const handleInputChange = useCallback((e) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  }, []);

  const handleRecentClick = useCallback((searchQuery) => {
    setQuery(searchQuery);
    inputRef.current?.focus();
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-card p-2 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
              {/* Search Input */}
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder="Search pages, tools, or actions..."
                    className="w-full pl-12 pr-20 py-4 bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-400 text-lg"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Search input"
                  />
                  
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* Voice Search Indicator */}
                    {isListening && (
                      <span className="flex items-center gap-1 text-red-500 text-xs animate-pulse">
                        <FiMic className="w-4 h-4" />
                      </span>
                    )}
                    
                    {/* Close Button */}
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      aria-label="Close search"
                      type="button"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Results / Recent / Empty */}
              <div className="max-h-[350px] overflow-y-auto overscroll-contain" ref={resultsRef}>
                {/* Search Results */}
                {showResults && (
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Results for "{debouncedQuery}"
                    </div>
                    {results.map((item, index) => {
                      const isSelected = index === selectedIndex;
                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                            isSelected
                              ? 'bg-primary-500 text-white shadow-md'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span className="flex items-center gap-3">
                            <item.icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                            <span className="text-sm">{item.label}</span>
                            <span className={`text-xs ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                              in {item.category}
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            {item.isAction && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'}`}>
                                Action
                              </span>
                            )}
                            {isSelected && <FiCornerDownLeft className="w-3 h-3 opacity-70" />}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Recent Searches */}
                {showRecent && (
                  <div className="py-1">
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Recent Searches
                      </span>
                      <button
                        onClick={clearRecent}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        type="button"
                      >
                        Clear
                      </button>
                    </div>
                    {recent.map((searchQuery, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentClick(searchQuery)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        type="button"
                      >
                        <FiClock className="w-4 h-4 text-gray-400" />
                        {searchQuery}
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {showEmpty && (
                  <div className="py-8 text-center">
                    <FiSearch className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No results for "{debouncedQuery}"
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Try a different search term
                    </p>
                  </div>
                )}

                {/* No query yet - Quick Links */}
                {!debouncedQuery && !showRecent && (
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quick Links
                    </div>
                    {SEARCH_INDEX.filter(i => i.isAction).slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        type="button"
                      >
                        <item.icon className="w-4 h-4 text-primary-500" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <FiArrowUp className="w-3 h-3" /><FiArrowDown className="w-3 h-3" /> Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCornerDownLeft className="w-3 h-3" /> Select
                  </span>
                </div>
                <span>ESC to close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(SearchBar);
