import React, { useState, useEffect, useCallback } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiTrash2, 
  FiCalendar, 
  FiAward,
  FiExternalLink,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiAlertCircle,
  FiCopy,
  FiStar,
  FiInfo,
  FiTrendingUp,
  FiClock,
  FiEdit2,
  FiSave,
  FiMoreHorizontal,
  FiGrid,
  FiList,
  FiEye,
  FiRefreshCw,
  FiTag,
  FiBookmark,
  FiShare2,
  FiDownload,
  FiFilter,
  FiSearch
} from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Card from '../../ui/Card';
import Progress from '../../ui/Progress';
import Tooltip from '../../ui/Tooltip';
import Modal from '../../ui/Modal';
import toast from 'react-hot-toast';
import { debounce } from 'lodash';

// Certification categories and popular certifications
const certificationCategories = [
  { id: 'cloud', name: 'Cloud Computing', icon: '☁️' },
  { id: 'project-management', name: 'Project Management', icon: '📊' },
  { id: 'agile', name: 'Agile & Scrum', icon: '🔄' },
  { id: 'data-science', name: 'Data Science & AI', icon: '📈' },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒' },
  { id: 'programming', name: 'Programming', icon: '💻' },
  { id: 'design', name: 'Design', icon: '🎨' },
  { id: 'marketing', name: 'Digital Marketing', icon: '📱' },
  { id: 'language', name: 'Language', icon: '🌐' },
  { id: 'other', name: 'Other', icon: '📜' }
];

const popularCertifications = {
  cloud: [
    { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services' },
    { name: 'Microsoft Certified: Azure Administrator', issuer: 'Microsoft' },
    { name: 'Google Cloud Professional Cloud Architect', issuer: 'Google Cloud' }
  ],
  'project-management': [
    { name: 'Project Management Professional (PMP)', issuer: 'PMI' },
    { name: 'Certified Associate in Project Management (CAPM)', issuer: 'PMI' },
    { name: 'PRINCE2 Practitioner', issuer: 'AXELOS' }
  ],
  agile: [
    { name: 'Certified ScrumMaster (CSM)', issuer: 'Scrum Alliance' },
    { name: 'Professional Scrum Master (PSM)', issuer: 'Scrum.org' },
    { name: 'SAFe Agilist', issuer: 'Scaled Agile' }
  ],
  'data-science': [
    { name: 'Google Data Analytics Professional Certificate', issuer: 'Google' },
    { name: 'IBM Data Science Professional Certificate', issuer: 'IBM' },
    { name: 'Microsoft Certified: Data Analyst Associate', issuer: 'Microsoft' }
  ],
  cybersecurity: [
    { name: 'CompTIA Security+', issuer: 'CompTIA' },
    { name: 'Certified Information Systems Security Professional (CISSP)', issuer: '(ISC)²' },
    { name: 'Certified Ethical Hacker (CEH)', issuer: 'EC-Council' }
  ],
  programming: [
    { name: 'Oracle Certified Professional: Java SE', issuer: 'Oracle' },
    { name: 'Microsoft Certified: Azure Developer Associate', issuer: 'Microsoft' },
    { name: 'AWS Certified Developer', issuer: 'Amazon Web Services' }
  ]
};

const Certifications = ({ data = [], onChange, onValidationChange }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [viewMode, setViewMode] = useState('detailed');
  const [sortOrder, setSortOrder] = useState('date');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [certStats, setCertStats] = useState({
    total: 0,
    verified: 0,
    expiring: 0,
    categories: {}
  });

  const { 
    register, 
    control, 
    handleSubmit, 
    watch,
    setValue,
    trigger,
    formState: { errors, isValid, isDirty } 
  } = useForm({
    defaultValues: { 
      certifications: data?.length ? data : [{
        name: '',
        issuer: '',
        date: '',
        expiryDate: '',
        credentialId: '',
        link: '',
        category: 'other',
        score: '',
        description: '',
        neverExpires: false,
        verified: false
      }]
    },
    mode: 'onChange'
  });

  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: 'certifications'
  });

  const watchedFields = watch('certifications');

  // Calculate completion and stats
  useEffect(() => {
    calculateCompletion();
    calculateCertStats();
  }, [watchedFields]);

  // Auto-save with debounce
  const debouncedSave = useCallback(
    debounce((formData) => {
      handleSave(formData);
    }, 1000),
    []
  );

  useEffect(() => {
    if (isDirty) {
      setAutoSaveStatus('saving');
      debouncedSave(watchedFields);
    }
  }, [watchedFields, isDirty]);

  const calculateCompletion = () => {
    if (!watchedFields) return;

    let totalFields = 0;
    let completedFields = 0;

    watchedFields.forEach((cert) => {
      const requiredFields = ['name', 'issuer'];
      requiredFields.forEach(field => {
        totalFields++;
        if (cert[field]?.trim()) completedFields++;
      });
    });

    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    setCompletionPercentage(percentage);

    onValidationChange?.({
      isValid,
      completionPercentage: percentage,
      count: fields.length,
      errors: Object.keys(errors).length
    });
  };

  const calculateCertStats = () => {
    if (!watchedFields) return;

    const stats = {
      total: watchedFields.length,
      verified: watchedFields.filter(c => c.verified).length,
      expiring: 0,
      categories: {}
    };

    watchedFields.forEach(cert => {
      // Count categories
      stats.categories[cert.category] = (stats.categories[cert.category] || 0) + 1;
      
      // Check for expiring certifications (within 3 months)
      if (cert.expiryDate && !cert.neverExpires) {
        const expiry = new Date(cert.expiryDate);
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        
        if (expiry <= threeMonthsFromNow && expiry > new Date()) {
          stats.expiring++;
        }
      }
    });

    setCertStats(stats);
  };

  const handleSave = (formData) => {
    const sortedCertifications = sortCertifications(formData);
    onChange(sortedCertifications);
    setAutoSaveStatus('saved');
    setTimeout(() => setAutoSaveStatus('idle'), 3000);
  };

  const sortCertifications = (certsArray) => {
    if (!certsArray) return [];
    
    return [...certsArray].sort((a, b) => {
      switch (sortOrder) {
        case 'date':
          return (b.date || '').localeCompare(a.date || '');
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'issuer':
          return (a.issuer || '').localeCompare(b.issuer || '');
        default:
          return 0;
      }
    });
  };

  const addCertification = () => {
    append({
      name: '',
      issuer: '',
      date: '',
      expiryDate: '',
      credentialId: '',
      link: '',
      category: 'other',
      score: '',
      description: '',
      neverExpires: false,
      verified: false
    });
    toast.success('New certification added');
  };

  const addSuggestedCertification = (cert) => {
    append({
      name: cert.name,
      issuer: cert.issuer,
      date: '',
      expiryDate: '',
      credentialId: '',
      link: '',
      category: selectedCategory !== 'all' ? selectedCategory : 'other',
      score: '',
      description: '',
      neverExpires: false,
      verified: false
    });
    toast.success(`Added ${cert.name}`);
    setShowSuggestions(false);
  };

  const duplicateCertification = (index) => {
    const itemToDuplicate = { ...watchedFields[index] };
    delete itemToDuplicate.id;
    append(itemToDuplicate);
    toast.success('Certification duplicated');
  };

  const removeCertification = (index) => {
    remove(index);
    toast.success('Certification removed');
  };

  const toggleExpand = (index) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedItems(newSet);
  };

  const toggleVerified = (index) => {
    const currentValue = watchedFields[index]?.verified || false;
    setValue(`certifications.${index}.verified`, !currentValue);
    toast.success(currentValue ? 'Removed verification' : 'Marked as verified');
  };

  const checkExpiryStatus = (expiryDate, neverExpires) => {
    if (neverExpires) return { status: 'valid', label: 'No Expiry', color: 'text-blue-500' };
    if (!expiryDate) return { status: 'unknown', label: 'No Date', color: 'text-gray-400' };
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    if (expiry < now) {
      return { status: 'expired', label: 'Expired', color: 'text-red-500' };
    } else if (expiry <= threeMonthsFromNow) {
      return { status: 'expiring', label: 'Expiring Soon', color: 'text-yellow-500' };
    } else {
      return { status: 'valid', label: 'Valid', color: 'text-green-500' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const moveItem = (from, to) => {
    if (to >= 0 && to < fields.length) {
      move(from, to);
      toast.success('Certification order updated');
    }
  };

  const getFilteredCertifications = () => {
    let filtered = watchedFields || [];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(cert => cert.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cert => 
        cert.name?.toLowerCase().includes(term) ||
        cert.issuer?.toLowerCase().includes(term) ||
        cert.credentialId?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  const getCategorySuggestions = () => {
    if (selectedCategory === 'all' || !popularCertifications[selectedCategory]) {
      return Object.values(popularCertifications).flat().slice(0, 6);
    }
    return popularCertifications[selectedCategory] || [];
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const filteredFields = getFilteredCertifications();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">Certifications</h3>
            {fields.length > 0 && (
              <Badge variant="primary" size="sm">
                {fields.length} {fields.length === 1 ? 'Certification' : 'Certifications'}
              </Badge>
            )}
            {certStats.verified > 0 && (
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" />
                {certStats.verified} Verified
              </Badge>
            )}
            {certStats.expiring > 0 && (
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                {certStats.expiring} Expiring
              </Badge>
            )}
          </div>
          
          {fields.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-xs">
                <Progress 
                  value={completionPercentage} 
                  size="sm" 
                  showPercentage
                />
              </div>
              {autoSaveStatus === 'saved' && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <FiCheckCircle className="w-3 h-3" />
                  Saved
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
          >
            <option value="date">Most Recent</option>
            <option value="name">By Name</option>
            <option value="issuer">By Issuer</option>
          </select>

          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                viewMode === 'detailed' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
              }`}
            >
              <FiList className="w-4 h-4 inline mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                viewMode === 'compact' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
              }`}
            >
              <FiGrid className="w-4 h-4 inline mr-1" />
              Grid
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSuggestions(true)}
            icon={<FiSearch />}
          >
            Suggestions
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={addCertification}
            icon={<FiPlus />}
          >
            Add Certification
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      {fields.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search certifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
          >
            <option value="all">All Categories</option>
            {certificationCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name} {certStats.categories[cat.id] && `(${certStats.categories[cat.id]})`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category Stats */}
      {fields.length > 0 && Object.keys(certStats.categories).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4">
            <div className="flex flex-wrap gap-3">
              {Object.entries(certStats.categories).map(([catId, count]) => {
                const category = certificationCategories.find(c => c.id === catId);
                return (
                  <Badge key={catId} variant="secondary" size="md">
                    {category?.icon} {category?.name}: {count}
                  </Badge>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Certifications List */}
      <form onChange={handleSubmit(handleSave)}>
        <motion.div 
          className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 gap-4' 
            : 'space-y-4'
          }
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {filteredFields.map((cert, idx) => {
              const originalIndex = watchedFields.findIndex(c => c === cert);
              const expiryStatus = checkExpiryStatus(cert?.expiryDate, cert?.neverExpires);
              const isExpanded = expandedItems.has(originalIndex) || viewMode === 'detailed';
              
              return (
                <motion.div
                  key={fields[originalIndex]?.id || idx}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  <Card className={`
                    relative overflow-hidden h-full
                    ${cert?.verified ? 'ring-1 ring-green-400 dark:ring-green-600' : ''}
                    ${!isExpanded && viewMode !== 'grid' ? 'cursor-pointer' : ''}
                  `}>
                    {/* Compact/Grid View */}
                    <div 
                      className="p-4 sm:p-5"
                      onClick={() => viewMode !== 'grid' && viewMode === 'compact' && toggleExpand(originalIndex)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center text-xl">
                            {certificationCategories.find(c => c.id === cert?.category)?.icon || '📜'}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold truncate flex items-center gap-2">
                                {cert?.name || 'New Certification'}
                                {cert?.verified && (
                                  <FiCheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {cert?.issuer || 'Issuing Organization'}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {viewMode !== 'grid' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveItem(originalIndex, originalIndex - 1);
                                    }}
                                    disabled={originalIndex === 0}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      originalIndex === 0 
                                        ? 'opacity-50 cursor-not-allowed' 
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    <FiChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveItem(originalIndex, originalIndex + 1);
                                    }}
                                    disabled={originalIndex === fields.length - 1}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      originalIndex === fields.length - 1
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    <FiChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              
                              {viewMode === 'grid' ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(originalIndex);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                  {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                </button>
                              ) : viewMode === 'compact' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(originalIndex);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                  {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Date and Status */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
                            {cert?.date && (
                              <span className="flex items-center gap-1 text-gray-500">
                                <FiCalendar className="w-3 h-3" />
                                Issued: {formatDate(cert.date)}
                              </span>
                            )}
                            <span className={`flex items-center gap-1 ${expiryStatus.color}`}>
                              <FiClock className="w-3 h-3" />
                              {expiryStatus.label}
                              {cert?.expiryDate && !cert?.neverExpires && `: ${formatDate(cert.expiryDate)}`}
                            </span>
                          </div>
                          
                          {/* Credential ID Preview */}
                          {!isExpanded && cert?.credentialId && (
                            <p className="mt-2 text-xs text-gray-500">
                              ID: {cert.credentialId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Form */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-4 sm:px-5 pb-5 space-y-4 border-t border-gray-200 dark:border-gray-700"
                        >
                          {/* Action Buttons */}
                          <div className="flex justify-end gap-2 pt-4">
                            <Tooltip content={cert?.verified ? 'Remove verification' : 'Mark as verified'}>
                              <button
                                type="button"
                                onClick={() => toggleVerified(originalIndex)}
                                className={`p-2 rounded-lg transition-colors ${
                                  cert?.verified
                                    ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                    : 'text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                }`}
                              >
                                <FiCheckCircle className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Preview certification">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCert(cert);
                                  setShowPreviewModal(true);
                                }}
                                className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Duplicate certification">
                              <button
                                type="button"
                                onClick={() => duplicateCertification(originalIndex)}
                                className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              >
                                <FiCopy className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Remove certification">
                              <button
                                type="button"
                                onClick={() => removeCertification(originalIndex)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>

                          {/* Form Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Certification Name"
                              icon={<FiAward />}
                              placeholder="e.g., AWS Certified Solutions Architect"
                              {...register(`certifications.${originalIndex}.name`, { required: 'Certification name is required' })}
                              error={errors.certifications?.[originalIndex]?.name?.message}
                            />
                            
                            <Input
                              label="Issuing Organization"
                              placeholder="e.g., Amazon Web Services"
                              {...register(`certifications.${originalIndex}.issuer`, { required: 'Issuing organization is required' })}
                              error={errors.certifications?.[originalIndex]?.issuer?.message}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Category
                            </label>
                            <select
                              {...register(`certifications.${originalIndex}.category`)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                            >
                              {certificationCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.icon} {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Issue Date"
                              type="month"
                              icon={<FiCalendar />}
                              {...register(`certifications.${originalIndex}.date`)}
                            />
                            
                            <div>
                              <Input
                                label="Expiry Date"
                                type="month"
                                icon={<FiCalendar />}
                                disabled={cert?.neverExpires}
                                {...register(`certifications.${originalIndex}.expiryDate`)}
                              />
                              <label className="flex items-center gap-2 mt-2">
                                <input
                                  type="checkbox"
                                  {...register(`certifications.${originalIndex}.neverExpires`)}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  This certification never expires
                                </span>
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Credential ID"
                              icon={<FiTag />}
                              placeholder="e.g., AWS-ASA-12345"
                              {...register(`certifications.${originalIndex}.credentialId`)}
                            />
                            
                            <Input
                              label="Score/Grade (Optional)"
                              placeholder="e.g., 850/1000 or 92%"
                              {...register(`certifications.${originalIndex}.score`)}
                            />
                          </div>

                          <Input
                            label="Credential URL"
                            icon={<FiExternalLink />}
                            placeholder="https://www.credly.com/badges/..."
                            {...register(`certifications.${originalIndex}.link`, {
                              pattern: {
                                value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                                message: 'Invalid URL'
                              }
                            })}
                            error={errors.certifications?.[originalIndex]?.link?.message}
                          />

                          {/* Description Field */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Description (Optional)
                            </label>
                            <textarea
                              {...register(`certifications.${originalIndex}.description`)}
                              rows={2}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                              placeholder="Add any additional details about the certification..."
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty State */}
          {fields.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <FiAward className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">No Certifications Added</h4>
              <p className="text-gray-500 mb-4">
                Add your professional certifications to demonstrate your expertise
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={addCertification} icon={<FiPlus />}>
                  Add Certification
                </Button>
                <Button variant="outline" onClick={() => setShowSuggestions(true)} icon={<FiSearch />}>
                  Browse Suggestions
                </Button>
              </div>
            </motion.div>
          )}

          {/* No Search Results */}
          {fields.length > 0 && filteredFields.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <FiSearch className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No certifications match your search</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            </motion.div>
          )}
        </motion.div>
      </form>

      {/* Suggestions Modal */}
      <Modal
        isOpen={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        title="Popular Certifications"
        size="lg"
      >
        <div className="space-y-4">
          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
          >
            <option value="all">All Categories</option>
            {certificationCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          {/* Suggestions List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {getCategorySuggestions().map((cert, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold">{cert.name}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{cert.issuer}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addSuggestedCertification(cert)}
                    icon={<FiPlus />}
                  >
                    Add
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Certification Preview"
      >
        {selectedCert && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center text-2xl">
                {certificationCategories.find(c => c.id === selectedCert.category)?.icon || '📜'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{selectedCert.name}</h3>
                <p className="text-primary-600 dark:text-primary-400">{selectedCert.issuer}</p>
              </div>
              {selectedCert.verified && (
                <Badge variant="success" className="flex items-center gap-1">
                  <FiCheckCircle className="w-3 h-3" />
                  Verified
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              {selectedCert.date && (
                <div>
                  <p className="text-gray-500">Issue Date</p>
                  <p className="font-medium">{formatDate(selectedCert.date)}</p>
                </div>
              )}
              {selectedCert.expiryDate && !selectedCert.neverExpires && (
                <div>
                  <p className="text-gray-500">Expiry Date</p>
                  <p className="font-medium">{formatDate(selectedCert.expiryDate)}</p>
                </div>
              )}
              {selectedCert.credentialId && (
                <div className="col-span-2">
                  <p className="text-gray-500">Credential ID</p>
                  <p className="font-medium font-mono">{selectedCert.credentialId}</p>
                </div>
              )}
              {selectedCert.score && (
                <div>
                  <p className="text-gray-500">Score/Grade</p>
                  <p className="font-medium">{selectedCert.score}</p>
                </div>
              )}
            </div>
            
            {selectedCert.description && (
              <div>
                <p className="text-gray-500 mb-1">Description</p>
                <p className="text-sm">{selectedCert.description}</p>
              </div>
            )}
            
            {selectedCert.link && (
              <Button 
                variant="outline" 
                onClick={() => window.open(selectedCert.link, '_blank')}
                className="w-full"
              >
                <FiExternalLink className="w-4 h-4 mr-2" />
                Verify Credential
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(Certifications);