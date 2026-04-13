import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheck, 
  FiEye, 
  FiInfo, 
  FiStar, 
  FiTrendingUp,
  FiGrid,
  FiList,
  FiX
} from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useTheme } from '../../contexts/ThemeContext';

const templates = [
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean and contemporary design with a professional touch',
    color: 'from-blue-500 to-cyan-500',
    gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    preview: '🎨',
    category: 'professional',
    popular: true,
    features: ['ATS-optimized', 'Two-column layout', 'Skills highlighting', 'Professional color scheme'],
    rating: 4.8,
    downloads: 12453,
    tags: ['tech', 'business', 'corporate']
  },
  {
    id: 'classic',
    name: 'Classic Executive',
    description: 'Traditional format ideal for senior positions and conservative industries',
    color: 'from-gray-600 to-gray-800',
    gradient: 'bg-gradient-to-br from-gray-600 to-gray-800',
    preview: '📄',
    category: 'executive',
    popular: true,
    features: ['Traditional layout', 'Executive summary', 'Chronological format', 'Conservative design'],
    rating: 4.6,
    downloads: 9876,
    tags: ['executive', 'finance', 'legal', 'traditional']
  },
  {
    id: 'creative',
    name: 'Creative Portfolio',
    description: 'Stand out with a unique and creative layout for design and creative roles',
    color: 'from-purple-500 to-pink-500',
    gradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
    preview: '✨',
    category: 'creative',
    features: ['Portfolio section', 'Creative typography', 'Color customization', 'Project showcase'],
    rating: 4.9,
    downloads: 15234,
    tags: ['design', 'creative', 'arts', 'media']
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    description: 'Simple and elegant with focus on content and readability',
    color: 'from-green-500 to-emerald-500',
    gradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
    preview: '◻️',
    category: 'minimal',
    features: ['Clean typography', 'White space focused', 'Simple structure', 'Fast scanning'],
    rating: 4.7,
    downloads: 11234,
    tags: ['minimal', 'simple', 'elegant', 'modern']
  },
  {
    id: 'tech',
    name: 'Tech Innovator',
    description: 'Modern design tailored for tech industry professionals',
    color: 'from-indigo-500 to-blue-600',
    gradient: 'bg-gradient-to-br from-indigo-500 to-blue-600',
    preview: '💻',
    category: 'tech',
    popular: true,
    features: ['GitHub integration', 'Tech stack display', 'Project emphasis', 'Modern layout'],
    rating: 4.9,
    downloads: 18765,
    tags: ['tech', 'developer', 'engineering', 'IT']
  },
  {
    id: 'elegant',
    name: 'Elegant Serif',
    description: 'Sophisticated serif design for academic and research positions',
    color: 'from-amber-500 to-orange-600',
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
    preview: '📚',
    category: 'academic',
    features: ['Publications section', 'Research focus', 'Serif typography', 'Academic format'],
    rating: 4.5,
    downloads: 6543,
    tags: ['academic', 'research', 'education', 'science']
  }
];

const categories = [
  { id: 'all', name: 'All Templates', icon: '📋' },
  { id: 'professional', name: 'Professional', icon: '💼' },
  { id: 'creative', name: 'Creative', icon: '🎨' },
  { id: 'executive', name: 'Executive', icon: '👔' },
  { id: 'tech', name: 'Tech', icon: '💻' },
  { id: 'minimal', name: 'Minimal', icon: '✨' }
];

const TemplateSelector = ({ selected, onSelect, className = '' }) => {
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [sortBy, setSortBy] = useState('popular'); // 'popular', 'rating', 'newest'
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Sort templates
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'downloads':
          return (b.downloads || 0) - (a.downloads || 0);
        case 'popular':
        default:
          return (b.popular ? 1 : 0) - (a.popular ? 1 : 0) || 
                 (b.rating || 0) - (a.rating || 0);
      }
    });
  }, [selectedCategory, sortBy, searchTerm]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold gradient-text mb-1">
            Choose Your Template
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Select from our collection of ATS-optimized professional templates
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              aria-label="Grid view"
              title="Grid view"
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              aria-label="List view"
              title="List view"
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Toggle (Mobile) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={`${showFilters ? 'block' : 'hidden'} sm:block space-y-4`}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search templates by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 
                       bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm 
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent 
                       outline-none transition-all duration-200"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 
                     bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent 
                     outline-none transition-all duration-200 cursor-pointer"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="downloads">Most Downloaded</option>
          </select>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium
                transition-all duration-200 whitespace-nowrap
                ${selectedCategory === category.id
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
          {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
        </p>
        
        {filteredTemplates.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory('all');
              setSearchTerm('');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Templates Grid/List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`
          ${viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
            : 'space-y-3'
          }
        `}
      >
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              variants={itemVariants}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={viewMode === 'list' ? 'w-full' : ''}
            >
              {viewMode === 'grid' ? (
                <TemplateCard
                  template={template}
                  selected={selected}
                  onSelect={onSelect}
                  onPreview={() => setPreviewTemplate(template)}
                  isDark={isDark}
                />
              ) : (
                <TemplateListItem
                  template={template}
                  selected={selected}
                  onSelect={onSelect}
                  onPreview={() => setPreviewTemplate(template)}
                  isDark={isDark}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h4 className="text-lg font-semibold mb-2">No templates found</h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedCategory('all');
              setSearchTerm('');
            }}
          >
            View All Templates
          </Button>
        </motion.div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate?.name}
        size="lg"
      >
        {previewTemplate && (
          <div className="space-y-4">
            {/* Preview Image */}
            <div className={`w-full h-64 rounded-xl ${previewTemplate.gradient} flex items-center justify-center text-6xl`}>
              {previewTemplate.preview}
            </div>

            {/* Template Info */}
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                {previewTemplate.description}
              </p>

              {/* Features */}
              <div>
                <h5 className="font-semibold mb-2">Key Features:</h5>
                <ul className="grid grid-cols-2 gap-2">
                  {previewTemplate.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <FiStar className="w-4 h-4 text-yellow-500" />
                  <span>{previewTemplate.rating} / 5.0</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiTrendingUp className="w-4 h-4 text-blue-500" />
                  <span>{previewTemplate.downloads.toLocaleString()} downloads</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {previewTemplate.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant={selected === previewTemplate.id ? 'secondary' : 'primary'}
                onClick={() => {
                  onSelect(previewTemplate.id);
                  setPreviewTemplate(null);
                }}
                className="flex-1"
              >
                {selected === previewTemplate.id ? 'Currently Selected' : 'Use This Template'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreviewTemplate(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Template Card Component (Grid View)
const TemplateCard = ({ template, selected, onSelect, onPreview, isDark }) => {
  return (
    <Card
      className={`
        p-4 sm:p-5 cursor-pointer relative overflow-hidden group h-full
        transition-all duration-300 hover:shadow-xl
        ${selected === template.id 
          ? 'ring-2 ring-primary-500 shadow-lg' 
          : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
        }
      `}
      onClick={() => onSelect(template.id)}
    >
      {/* Selection Indicator */}
      {selected === template.id && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg z-10"
        >
          <FiCheck className="w-4 h-4 text-white" />
        </motion.div>
      )}

      {/* Popular Badge */}
      {template.popular && (
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-md">
            <FiStar className="w-3 h-3" />
            Popular
          </span>
        </div>
      )}

      {/* Preview Area */}
      <div className="relative">
        <div className={`
          w-full h-36 sm:h-40 rounded-lg ${template.gradient} mb-4 
          flex items-center justify-center text-4xl sm:text-5xl
          transition-transform duration-300 group-hover:scale-105
          overflow-hidden
        `}>
          <motion.span
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {template.preview}
          </motion.span>
        </div>

        {/* Preview Button Overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
        >
          <span className="px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg text-sm font-medium flex items-center gap-1">
            <FiEye className="w-4 h-4" />
            Quick Preview
          </span>
        </button>
      </div>

      {/* Template Info */}
      <div>
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-semibold text-base sm:text-lg">
            {template.name}
          </h4>
          <div className="flex items-center gap-0.5 ml-2">
            <FiStar className="w-3.5 h-3.5 text-yellow-500 fill-current" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {template.rating}
            </span>
          </div>
        </div>
        
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
          {template.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-600 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 2 && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-600 dark:text-gray-400">
              +{template.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

// Template List Item Component (List View)
const TemplateListItem = ({ template, selected, onSelect, onPreview, isDark }) => {
  return (
    <Card
      className={`
        p-4 cursor-pointer relative overflow-hidden group
        transition-all duration-300 hover:shadow-lg
        ${selected === template.id 
          ? 'ring-2 ring-primary-500 shadow-lg' 
          : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
        }
      `}
      onClick={() => onSelect(template.id)}
    >
      <div className="flex items-center gap-4">
        {/* Preview Thumbnail */}
        <div className="relative flex-shrink-0">
          <div className={`
            w-20 h-20 sm:w-24 sm:h-24 rounded-lg ${template.gradient} 
            flex items-center justify-center text-3xl
            transition-transform duration-300 group-hover:scale-105
          `}>
            {template.preview}
          </div>
          
          {selected === template.id && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <FiCheck className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>

        {/* Template Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-base sm:text-lg truncate">
              {template.name}
            </h4>
            {template.popular && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                <FiStar className="w-3 h-3" />
                Popular
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {template.description}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm">{template.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiTrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm">{template.downloads.toLocaleString()}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            icon={<FiEye />}
          >
            Preview
          </Button>
          <Button
            variant={selected === template.id ? 'secondary' : 'primary'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(template.id);
            }}
          >
            {selected === template.id ? 'Selected' : 'Select'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(TemplateSelector);