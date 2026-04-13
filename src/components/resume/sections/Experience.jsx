import React, { useState, useEffect, useCallback } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiTrash2, 
  FiCalendar, 
  FiBriefcase, 
  FiMapPin,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiAlertCircle,
  FiCopy,
  FiStar,
  FiTrendingUp,
  FiAward,
  FiClock,
  FiEdit2,
  FiSave,
  FiMoreHorizontal,
  FiZap,
  FiList,
  FiGrid,
  FiExternalLink,
  FiInfo,
  FiTarget,
  FiUsers,
  FiDollarSign
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

// ATS-friendly action verbs by category
const actionVerbs = {
  leadership: ['Led', 'Managed', 'Directed', 'Supervised', 'Coordinated', 'Spearheaded', 'Orchestrated', 'Headed'],
  achievement: ['Achieved', 'Increased', 'Decreased', 'Improved', 'Reduced', 'Generated', 'Delivered', 'Exceeded'],
  development: ['Developed', 'Created', 'Designed', 'Built', 'Implemented', 'Launched', 'Established', 'Founded'],
  analysis: ['Analyzed', 'Evaluated', 'Assessed', 'Researched', 'Investigated', 'Identified', 'Reviewed', 'Audited'],
  collaboration: ['Collaborated', 'Partnered', 'Facilitated', 'Negotiated', 'Communicated', 'Presented', 'Advised', 'Consulted'],
  optimization: ['Optimized', 'Streamlined', 'Enhanced', 'Automated', 'Restructured', 'Revitalized', 'Transformed', 'Modernized']
};

const Experience = ({ data = [], onChange, onValidationChange }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [viewMode, setViewMode] = useState('detailed');
  const [sortOrder, setSortOrder] = useState('date');
  const [showBulletSuggestions, setShowBulletSuggestions] = useState({});
  const [selectedVerb, setSelectedVerb] = useState(null);
  const [showVerbModal, setShowVerbModal] = useState(false);
  const [totalExperience, setTotalExperience] = useState({ years: 0, months: 0 });

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
      experience: data?.length ? data : [{
        company: '',
        title: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        achievements: [],
        technologies: [],
        teamSize: '',
        budget: '',
        employmentType: 'full-time'
      }]
    },
    mode: 'onChange'
  });

  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: 'experience'
  });

  const watchedFields = watch('experience');

  // Calculate completion and total experience
  useEffect(() => {
    calculateCompletion();
    calculateTotalExperience();
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

    watchedFields.forEach((exp) => {
      const requiredFields = ['company', 'title', 'startDate', 'description'];
      requiredFields.forEach(field => {
        totalFields++;
        if (exp[field]?.trim()) completedFields++;
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

  const calculateTotalExperience = () => {
    if (!watchedFields) return;

    let totalMonths = 0;
    
    watchedFields.forEach(exp => {
      if (exp.startDate) {
        const start = new Date(exp.startDate);
        const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
        const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                       (end.getMonth() - start.getMonth());
        if (months > 0) totalMonths += months;
      }
    });

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    setTotalExperience({ years, months });
  };

  const handleSave = (formData) => {
    const sortedExperience = sortExperience(formData);
    onChange(sortedExperience);
    setAutoSaveStatus('saved');
    setTimeout(() => setAutoSaveStatus('idle'), 3000);
  };

  const sortExperience = (experienceArray) => {
    if (!experienceArray) return [];
    
    return [...experienceArray].sort((a, b) => {
      switch (sortOrder) {
        case 'date':
          const dateA = a.current ? '9999' : (a.endDate || '');
          const dateB = b.current ? '9999' : (b.endDate || '');
          return dateB.localeCompare(dateA);
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });
  };

  const addExperience = () => {
    append({
      company: '',
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: [],
      technologies: [],
      teamSize: '',
      budget: '',
      employmentType: 'full-time'
    });
    toast.success('New experience entry added');
  };

  const duplicateExperience = (index) => {
    const itemToDuplicate = { ...watchedFields[index] };
    delete itemToDuplicate.id;
    append(itemToDuplicate);
    toast.success('Experience entry duplicated');
  };

  const removeExperience = (index) => {
    remove(index);
    toast.success('Experience entry removed');
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

  const calculateDuration = (startDate, endDate, current) => {
    if (!startDate) return null;
    
    const start = new Date(startDate);
    const end = current ? new Date() : (endDate ? new Date(endDate) : new Date());
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) return `${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    if (remainingMonths === 0) return `${years} yr${years > 1 ? 's' : ''}`;
    return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo`;
  };

  const generateAchievementBullet = (index, category) => {
    const exp = watchedFields[index];
    const verbs = actionVerbs[category] || actionVerbs.achievement;
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    
    let bullet = '';
    const title = exp?.title || '[Job Title]';
    const company = exp?.company || '[Company]';
    
    const templates = [
      `${verb} ${title.toLowerCase()} initiatives at ${company}, resulting in [X]% improvement in [metric].`,
      `${verb} [project/initiative] that generated $[X] in revenue and improved [process] by [Y]%.`,
      `${verb} a team of [X] ${title.toLowerCase()}s to deliver [project] on time and under budget.`,
      `${verb} and implemented [strategy/solution] that reduced costs by [X]% and increased efficiency.`,
      `${verb} cross-functional collaboration with [teams] to launch [product/feature] serving [X] users.`
    ];
    
    bullet = templates[Math.floor(Math.random() * templates.length)];
    
    const currentDesc = exp?.description || '';
    const newDesc = currentDesc ? `${currentDesc}\n• ${bullet}` : `• ${bullet}`;
    setValue(`experience.${index}.description`, newDesc);
    
    setShowBulletSuggestions({ ...showBulletSuggestions, [index]: false });
    toast.success('Achievement bullet added!');
  };

  const analyzeDescription = (description) => {
    if (!description) return { score: 0, suggestions: [] };
    
    let score = 0;
    const suggestions = [];
    
    // Check for action verbs
    const hasActionVerb = Object.values(actionVerbs).flat().some(verb => 
      description.toLowerCase().includes(verb.toLowerCase())
    );
    if (hasActionVerb) score += 30;
    else suggestions.push('Start bullets with strong action verbs');
    
    // Check for metrics
    const hasMetrics = /(\d+%|\$\d+|\d+\s*(people|users|clients|team)|increased|decreased|reduced|improved)/i.test(description);
    if (hasMetrics) score += 40;
    else suggestions.push('Include quantifiable achievements with numbers or percentages');
    
    // Check length
    const words = description.split(/\s+/).length;
    if (words >= 30) score += 30;
    else suggestions.push('Add more detail (aim for at least 30 words)');
    
    return { score, suggestions };
  };

  const getEmploymentTypeIcon = (type) => {
    const icons = {
      'full-time': '💼',
      'part-time': '🕐',
      'contract': '📋',
      'freelance': '🚀',
      'internship': '🎓',
      'volunteer': '🤝'
    };
    return icons[type] || '💼';
  };

  const moveItem = (from, to) => {
    if (to >= 0 && to < fields.length) {
      move(from, to);
      toast.success('Experience order updated');
    }
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

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">Work Experience</h3>
            {fields.length > 0 && (
              <Badge variant="primary" size="sm">
                {fields.length} {fields.length === 1 ? 'Position' : 'Positions'}
              </Badge>
            )}
            {totalExperience.years > 0 && (
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                {totalExperience.years}+ years
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
            <option value="company">By Company</option>
            <option value="title">By Title</option>
          </select>

          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                viewMode === 'detailed' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                viewMode === 'compact' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
              }`}
            >
              Compact
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={addExperience}
            icon={<FiPlus />}
          >
            Add Experience
          </Button>
        </div>
      </div>

      {/* Total Experience Summary */}
      {fields.length > 0 && totalExperience.years > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <FiBriefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Professional Experience</p>
                <p className="text-xl font-bold">
                  {totalExperience.years > 0 && `${totalExperience.years} year${totalExperience.years > 1 ? 's' : ''}`}
                  {totalExperience.months > 0 && ` ${totalExperience.months} month${totalExperience.months > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Experience List */}
      <form onChange={handleSubmit(handleSave)}>
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {fields.map((field, index) => {
              const exp = watchedFields[index];
              const duration = calculateDuration(exp?.startDate, exp?.endDate, exp?.current);
              const descriptionAnalysis = analyzeDescription(exp?.description);
              const isExpanded = expandedItems.has(index) || viewMode === 'detailed';
              
              return (
                <motion.div
                  key={field.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  <Card className={`relative overflow-hidden ${!isExpanded ? 'cursor-pointer' : ''}`}>
                    {/* Compact View Header */}
                    <div 
                      className="p-4 sm:p-6"
                      onClick={() => viewMode === 'compact' && toggleExpand(index)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center text-2xl">
                            {getEmploymentTypeIcon(exp?.employmentType)}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-semibold text-lg truncate">
                                {exp?.title || 'New Position'}
                              </h4>
                              <p className="text-primary-600 dark:text-primary-400">
                                {exp?.company || 'Company Name'}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveItem(index, index - 1);
                                }}
                                disabled={index === 0}
                                className={`p-2 rounded-lg transition-colors ${
                                  index === 0 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                <FiChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveItem(index, index + 1);
                                }}
                                disabled={index === fields.length - 1}
                                className={`p-2 rounded-lg transition-colors ${
                                  index === fields.length - 1
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                <FiChevronDown className="w-4 h-4" />
                              </button>
                              
                              {viewMode === 'compact' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(index);
                                  }}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                  {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {exp?.location && (
                              <span className="flex items-center gap-1">
                                <FiMapPin className="w-3 h-3" />
                                {exp.location}
                              </span>
                            )}
                            {exp?.startDate && (
                              <span className="flex items-center gap-1">
                                <FiCalendar className="w-3 h-3" />
                                {exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'Present'}
                              </span>
                            )}
                            {duration && (
                              <span className="flex items-center gap-1">
                                <FiClock className="w-3 h-3" />
                                {duration}
                              </span>
                            )}
                            {exp?.employmentType && exp.employmentType !== 'full-time' && (
                              <Badge variant="secondary" size="sm">
                                {exp.employmentType}
                              </Badge>
                            )}
                          </div>

                          {/* Description Preview */}
                          {!isExpanded && exp?.description && (
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {exp.description}
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
                          className="px-4 sm:px-6 pb-6 space-y-4 border-t border-gray-200 dark:border-gray-700"
                        >
                          {/* Action Buttons */}
                          <div className="flex justify-end gap-2 pt-4">
                            <Tooltip content="Duplicate this entry">
                              <button
                                type="button"
                                onClick={() => duplicateExperience(index)}
                                className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              >
                                <FiCopy className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Remove this entry">
                              <button
                                type="button"
                                onClick={() => removeExperience(index)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>

                          {/* Form Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Job Title"
                              icon={<FiBriefcase />}
                              placeholder="e.g., Senior Software Engineer"
                              {...register(`experience.${index}.title`, { required: 'Job title is required' })}
                              error={errors.experience?.[index]?.title?.message}
                            />
                            
                            <Input
                              label="Company"
                              placeholder="e.g., Google"
                              {...register(`experience.${index}.company`, { required: 'Company is required' })}
                              error={errors.experience?.[index]?.company?.message}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Location"
                              icon={<FiMapPin />}
                              placeholder="e.g., San Francisco, CA (or Remote)"
                              {...register(`experience.${index}.location`)}
                            />
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Employment Type
                              </label>
                              <select
                                {...register(`experience.${index}.employmentType`)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                              >
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                                <option value="contract">Contract</option>
                                <option value="freelance">Freelance</option>
                                <option value="internship">Internship</option>
                                <option value="volunteer">Volunteer</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Input
                                label="Start Date"
                                type="month"
                                icon={<FiCalendar />}
                                {...register(`experience.${index}.startDate`, { required: 'Start date is required' })}
                                error={errors.experience?.[index]?.startDate?.message}
                              />
                            </div>
                            
                            <div>
                              <Input
                                label="End Date"
                                type="month"
                                icon={<FiCalendar />}
                                disabled={exp?.current}
                                {...register(`experience.${index}.endDate`, {
                                  required: !exp?.current && 'End date is required'
                                })}
                                error={errors.experience?.[index]?.endDate?.message}
                              />
                              <label className="flex items-center gap-2 mt-2">
                                <input
                                  type="checkbox"
                                  {...register(`experience.${index}.current`)}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  I currently work here
                                </span>
                              </label>
                            </div>
                          </div>

                          {/* Advanced Fields */}
                          <details className="group">
                            <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500">
                              <FiMoreHorizontal className="w-4 h-4" />
                              Advanced Options
                              <FiChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                            </summary>
                            
                            <div className="mt-4 space-y-4 pl-6">
                              <div className="grid grid-cols-2 gap-4">
                                <Input
                                  label="Team Size"
                                  type="number"
                                  icon={<FiUsers />}
                                  placeholder="e.g., 5"
                                  {...register(`experience.${index}.teamSize`)}
                                />
                                <Input
                                  label="Budget Managed"
                                  icon={<FiDollarSign />}
                                  placeholder="e.g., $500K"
                                  {...register(`experience.${index}.budget`)}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Technologies Used
                                </label>
                                <Input
                                  placeholder="e.g., React, Node.js, Python, AWS"
                                  {...register(`experience.${index}.technologies`)}
                                />
                              </div>
                            </div>
                          </details>

                          {/* Description with ATS Analysis */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Description & Achievements
                              </label>
                              <div className="flex items-center gap-2">
                                {/* ATS Score Badge */}
                                <Badge 
                                  variant={descriptionAnalysis.score >= 70 ? 'success' : descriptionAnalysis.score >= 40 ? 'warning' : 'error'}
                                  size="sm"
                                >
                                  ATS Score: {descriptionAnalysis.score}%
                                </Badge>
                                
                                {/* Bullet Suggestions Dropdown */}
                                <div className="relative">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowBulletSuggestions({
                                      ...showBulletSuggestions,
                                      [index]: !showBulletSuggestions[index]
                                    })}
                                    icon={<FiZap />}
                                  >
                                    Suggest Bullets
                                  </Button>
                                  
                                  <AnimatePresence>
                                    {showBulletSuggestions[index] && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10"
                                      >
                                        <div className="p-2">
                                          <p className="text-xs text-gray-500 mb-2">Select a category:</p>
                                          {Object.keys(actionVerbs).map(category => (
                                            <button
                                              key={category}
                                              type="button"
                                              onClick={() => generateAchievementBullet(index, category)}
                                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg capitalize"
                                            >
                                              {category} Verbs
                                            </button>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                            
                            <textarea
                              {...register(`experience.${index}.description`, { required: 'Description is required' })}
                              rows={6}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200 font-mono text-sm"
                              placeholder="• Led development of [project] resulting in [X]% improvement in [metric]&#10;• Managed team of [X] engineers to deliver [feature] ahead of schedule&#10;• Implemented [technology/solution] reducing costs by $[X] annually"
                            />
                            
                            {errors.experience?.[index]?.description && (
                              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                <FiAlertCircle className="w-3 h-3" />
                                {errors.experience[index].description.message}
                              </p>
                            )}

                            {/* ATS Suggestions */}
                            {descriptionAnalysis.suggestions.length > 0 && (
                              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2 flex items-center gap-1">
                                  <FiTarget className="w-4 h-4" />
                                  Improvement Suggestions:
                                </p>
                                <ul className="space-y-1">
                                  {descriptionAnalysis.suggestions.map((suggestion, i) => (
                                    <li key={i} className="text-sm text-yellow-600 dark:text-yellow-300 flex items-start gap-2">
                                      <span>•</span>
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* ATS Tips */}
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h5 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                              <FiInfo className="w-4 h-4" />
                              ATS Optimization Tips
                            </h5>
                            <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                              <li>• Start each bullet with a strong action verb</li>
                              <li>• Include quantifiable results (%, $, #)</li>
                              <li>• Use industry-standard keywords from job descriptions</li>
                              <li>• Keep formatting simple - avoid tables or columns</li>
                              <li>• Aim for 3-5 bullet points per position</li>
                            </ul>
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
              <FiBriefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">No Work Experience Added</h4>
              <p className="text-gray-500 mb-4">
                Add your professional experience to showcase your career journey
              </p>
              <Button onClick={addExperience} icon={<FiPlus />}>
                Add Your First Experience
              </Button>
            </motion.div>
          )}
        </motion.div>
      </form>
    </div>
  );
};

export default React.memo(Experience);