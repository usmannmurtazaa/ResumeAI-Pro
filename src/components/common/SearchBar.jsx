import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiFileText, FiUser, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { resumeService } from '../../services/resumeService';
import Input from '../ui/Input';
import Loader from './Loader';

const SearchBar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }

    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const searchResumes = async () => {
      if (!query.trim() || !user) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const userResumes = await resumeService.getUserResumes(user.uid);
        const filtered = userResumes.filter(resume => 
          resume.name?.toLowerCase().includes(query.toLowerCase()) ||
          resume.data?.personal?.fullName?.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchResumes, 300);
    return () => clearTimeout(debounce);
  }, [query, user]);

  const handleSelect = (item) => {
    // Save to recent searches
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    if (item.type === 'resume') {
      navigate(`/builder/${item.id}`);
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            ref={searchRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-50 px-4"
          >
            <div className="glass-card p-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search resumes, templates, or help..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-10 py-3 text-lg bg-transparent border-none outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="mt-4 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="py-8">
                    <Loader />
                  </div>
                ) : query ? (
                  results.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 px-2">Results ({results.length})</p>
                      {results.map(resume => (
                        <button
                          key={resume.id}
                          onClick={() => handleSelect({ type: 'resume', id: resume.id })}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <FiFileText className="w-5 h-5 text-primary-500" />
                          <div className="flex-1 text-left">
                            <p className="font-medium">{resume.name || 'Untitled Resume'}</p>
                            <p className="text-sm text-gray-500">
                              Last modified: {new Date(resume.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiSearch className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500">No results found for "{query}"</p>
                    </div>
                  )
                ) : recentSearches.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <p className="text-xs text-gray-500">Recent Searches</p>
                      <button
                        onClick={() => {
                          setRecentSearches([]);
                          localStorage.removeItem('recentSearches');
                        }}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(search)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <FiClock className="w-5 h-5 text-gray-400" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiSearch className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Start typing to search...</p>
                  </div>
                )}
              </div>

              {/* Keyboard shortcuts */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-4 text-xs text-gray-500">
                <span>↑↓ to navigate</span>
                <span>↵ to select</span>
                <span>ESC to close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchBar;