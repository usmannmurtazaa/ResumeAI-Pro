import React, { useState, useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiTrash2, 
  FiCalendar, 
  FiBook, 
  FiAward, 
  FiStar,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiAlertCircle,
  FiCopy,
  FiEdit2,
  FiSave,
  FiX,
  FiInfo,
  FiBriefcase,
  FiClock,
  FiTrendingUp,
  FiMoreHorizontal,
  FiExternalLink
} from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Card from '../../ui/Card';
import Progress from '../../ui/Progress';
import Tooltip from '../../ui/Tooltip';
import Modal from '../../ui/Modal';
import toast from 'react-hot-toast';

const Education = ({ data = [], onChange, onValidationChange }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [sortOrder, setSortOrder] = useState('date'); // 'date', 'institution', 'degree'
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed', 'compact'

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
      education: data?.length ? data : [{
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
        achievements: '',
        honors: [],
        courses: [],
        thesis: '',
        advisor: '',
        description: ''
      }]
    },
    mode: 'onChange'
  });

  const { fields, append, remove, move, swap, update } = useFieldArray({
    control,
    name: 'education'
  });

  const watchedFields = watch('education');

  // Calculate completion for each education entry and overall
  useEffect(() => {
    calculateCompletion();
  }, [watchedFields]);

  // Auto-expand newly added items
  useEffect(() => {
    if (fields.length > 0) {
      const newSet = new Set(expandedItems);
      fields.forEach((_, index) => {
        if (!newSet.has(index) && index === fields.length - 1) {
          newSet.add(index);
        }
      });
      setExpandedItems(newSet);
    }
  }, [fields.length]);

  const calculateCompletion = () => {
    if (!watchedFields) return;

    let totalFields = 0;
    let completedFields = 0;

    watchedFields.forEach((edu) => {
      const requiredFields = ['institution', 'degree', 'field', 'startDate'];
      requiredFields.forEach(field => {
        totalFields++;
        if (edu[field]?.trim()) completedFields++;
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

  const onSubmit = (formData) => {
    // Sort education by date before saving
    const sortedEducation = sortEducation(formData.education);
    onChange(sortedEducation);
    setAutoSaveStatus('saved');
    setTimeout(() => setAutoSaveStatus('idle'), 3000);
  };

  const sortEducation = (educationArray) => {
    if (!educationArray) return [];
    
    return [...educationArray].sort((a, b) => {
      switch (sortOrder) {
        case 'date':
          // Most recent first
          const dateA = a.endDate || '9999';
          const dateB = b.endDate || '9999';
          return dateB.localeCompare(dateA);
        case 'institution':
          return (a.institution || '').localeCompare(b.institution || '');
        case 'degree':
          return (a.degree || '').localeCompare(b.degree || '');
        default:
          return 0;
      }
    });
  };

  const addEducation = () => {
    append({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
      achievements: '',
      honors: [],
      courses: [],
      thesis: '',
      advisor: '',
      description: ''
    });
    toast.success('New education entry added');
  };

  const duplicateEducation = (index) => {
    const itemToDuplicate = watchedFields[index];
    append({ ...itemToDuplicate });
    toast.success('Education entry duplicated');
  };

  const removeEducation = (index) => {
    remove(index);
    toast.success('Education entry removed');
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

  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return null;
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) return `${remainingMonths} months`;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  };

  const suggestInstitutions = (query) => {
    // Simulated institution suggestions
    const suggestions = [
      'Harvard University',
      'Stanford University',
      'Massachusetts Institute of Technology',
      'University of California, Berkeley',
      'Carnegie Mellon University',
      'University of Oxford',
      'University of Cambridge',
      'ETH Zurich'
    ].filter(i => i.toLowerCase().includes(query.toLowerCase()));
    
    return suggestions;
  };

  const getEducationLevelIcon = (degree) => {
    const lower = degree?.toLowerCase() || '';
    if (lower.includes('phd') || lower.includes('doctor')) return '🎓';
    if (lower.includes('master')) return '📚';
    if (lower.includes('bachelor')) return '📖';
    if (lower.includes('associate')) return '📝';
    return '🏫';
  };

  const getGPAFeedback = (gpa) => {
    const numGPA = parseFloat(gpa);
    if (isNaN(numGPA)) return null;
    if (numGPA >= 3.5) return { text: 'Excellent!', color: 'text-green-500' };
    if (numGPA >= 3.0) return { text: 'Good', color: 'text-blue-500' };
    if (numGPA >= 2.5) return { text: 'Average', color: 'text-yellow-500' };
    return { text: 'Consider omitting', color: 'text-orange-500' };
  };

  const moveItem = (from, to) => {
    if (to >= 0 && to < fields.length) {
      move(from, to);
      toast.success('Education order updated');
    }
  };

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
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">Education</h3>
            {fields.length > 0 && (
              <Badge variant="primary" size="sm">
                {fields.length} {fields.length === 1 ? 'Entry' : 'Entries'}
              </Badge>
            )}
            {completionPercentage === 100 && fields.length > 0 && (
              <Badge variant="success" className="flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" />
                Complete
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
          {/* Sort Options */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
          >
            <option value="date">Sort by Date</option>
            <option value="institution">Sort by Institution</option>
            <option value="degree">Sort by Degree</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                viewMode === 'detailed' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm' 
                  : ''
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                viewMode === 'compact' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm' 
                  : ''
              }`}
            >
              Compact
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={addEducation}
            icon={<FiPlus />}
          >
            Add Education
          </Button>
        </div>
      </div>

      {/* Education Timeline */}
      <form onChange={handleSubmit(onSubmit)}>
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {fields.map((field, index) => {
              const edu = watchedFields[index];
              const duration = calculateDuration(edu?.startDate, edu?.endDate);
              const gpaFeedback = getGPAFeedback(edu?.gpa);
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
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">
                              {getEducationLevelIcon(edu?.degree)}
                            </span>
                            <div>
                              <h4 className="font-semibold text-lg">
                                {edu?.institution || 'New Education'}
                              </h4>
                              {edu?.degree && (
                                <p className="text-primary-600 dark:text-primary-400">
                                  {edu.degree} {edu.field && `in ${edu.field}`}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            {edu?.startDate && (
                              <span className="flex items-center gap-1">
                                <FiCalendar className="w-3 h-3" />
                                {edu.startDate} - {edu.endDate || 'Present'}
                              </span>
                            )}
                            {duration && (
                              <span className="flex items-center gap-1">
                                <FiClock className="w-3 h-3" />
                                {duration}
                              </span>
                            )}
                            {edu?.gpa && (
                              <span className="flex items-center gap-1">
                                <FiStar className="w-3 h-3" />
                                GPA: {edu.gpa}
                                {gpaFeedback && (
                                  <span className={gpaFeedback.color}>
                                    ({gpaFeedback.text})
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Navigation Arrows */}
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

                          {/* Expand/Collapse Button */}
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

                      {/* Quick Stats Row */}
                      {!isExpanded && edu?.institution && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {edu.honors?.length > 0 && (
                            <Badge variant="secondary" size="sm">
                              {edu.honors.length} Honors
                            </Badge>
                          )}
                          {edu.courses?.length > 0 && (
                            <Badge variant="secondary" size="sm">
                              {edu.courses.length} Courses
                            </Badge>
                          )}
                        </div>
                      )}
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
                                onClick={() => duplicateEducation(index)}
                                className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              >
                                <FiCopy className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Remove this entry">
                              <button
                                type="button"
                                onClick={() => removeEducation(index)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>

                          {/* Basic Information */}
                          <div className="grid grid-cols-1 gap-4">
                            <div className="relative">
                              <Input
                                label="Institution"
                                icon={<FiBook />}
                                placeholder="e.g., Harvard University"
                                {...register(`education.${index}.institution`, { 
                                  required: 'Institution is required' 
                                })}
                                error={errors.education?.[index]?.institution?.message}
                              />
                              {edu?.institution && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedInstitution(edu.institution);
                                    setShowInstitutionModal(true);
                                  }}
                                  className="absolute right-3 top-9 text-gray-400 hover:text-primary-500"
                                >
                                  <FiInfo className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input
                                label="Degree"
                                placeholder="e.g., Bachelor of Science"
                                {...register(`education.${index}.degree`, { 
                                  required: 'Degree is required' 
                                })}
                                error={errors.education?.[index]?.degree?.message}
                              />
                              
                              <Input
                                label="Field of Study"
                                placeholder="e.g., Computer Science"
                                {...register(`education.${index}.field`)}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Input
                                  label="Start Date"
                                  type="month"
                                  icon={<FiCalendar />}
                                  {...register(`education.${index}.startDate`)}
                                />
                              </div>
                              
                              <div>
                                <Input
                                  label="End Date (or Expected)"
                                  type="month"
                                  icon={<FiCalendar />}
                                  {...register(`education.${index}.endDate`)}
                                />
                                <label className="flex items-center gap-2 mt-2">
                                  <input
                                    type="checkbox"
                                    checked={!edu?.endDate}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setValue(`education.${index}.endDate`, '');
                                      }
                                    }}
                                    className="rounded border-gray-300 text-primary-600"
                                  />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Currently studying
                                  </span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <Input
                                label="GPA"
                                placeholder="e.g., 3.8"
                                {...register(`education.${index}.gpa`, {
                                  pattern: {
                                    value: /^[0-4]\.?[0-9]?$/,
                                    message: 'Invalid GPA format'
                                  }
                                })}
                                error={errors.education?.[index]?.gpa?.message}
                              />
                              {gpaFeedback && (
                                <p className={`mt-1 text-sm ${gpaFeedback.color}`}>
                                  {gpaFeedback.text} - {gpaFeedback.text === 'Excellent!' ? 'Include in your resume' : 
                                    gpaFeedback.text === 'Good' ? 'Consider including if above 3.0' : 
                                    'Optional to include'}
                                </p>
                              )}
                            </div>

                            {/* Advanced Fields */}
                            <details className="group">
                              <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500">
                                <FiMoreHorizontal className="w-4 h-4" />
                                Advanced Options
                                <FiChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                              </summary>
                              
                              <div className="mt-4 space-y-4 pl-6">
                                <Input
                                  label="Thesis/Dissertation Title"
                                  placeholder="e.g., Machine Learning Applications in Healthcare"
                                  {...register(`education.${index}.thesis`)}
                                />
                                
                                <Input
                                  label="Academic Advisor"
                                  placeholder="e.g., Dr. Jane Smith"
                                  {...register(`education.${index}.advisor`)}
                                />
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Relevant Coursework
                                  </label>
                                  <textarea
                                    {...register(`education.${index}.courses`)}
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                                    placeholder="Enter courses separated by commas..."
                                  />
                                </div>
                              </div>
                            </details>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Honors & Awards
                              </label>
                              <textarea
                                {...register(`education.${index}.honors`)}
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                                placeholder="List honors, awards, and scholarships..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Additional Information
                              </label>
                              <textarea
                                {...register(`education.${index}.description`)}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                                placeholder="Describe any additional achievements, activities, or relevant experience..."
                              />
                            </div>
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
              <FiBook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">No Education Added</h4>
              <p className="text-gray-500 mb-4">
                Add your educational background to strengthen your resume
              </p>
              <Button onClick={addEducation} icon={<FiPlus />}>
                Add Your First Education
              </Button>
            </motion.div>
          )}
        </motion.div>
      </form>

      {/* Education Summary Card */}
      {fields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4" />
              Education Summary
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Total Institutions</p>
                <p className="text-xl font-bold">{fields.length}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Highest Degree</p>
                <p className="text-xl font-bold">
                  {fields.reduce((highest, _, idx) => {
                    const degree = watchedFields[idx]?.degree || '';
                    if (degree.toLowerCase().includes('phd')) return 'PhD';
                    if (degree.toLowerCase().includes('master') && highest !== 'PhD') return "Master's";
                    if (degree.toLowerCase().includes('bachelor') && !highest) return "Bachelor's";
                    return highest;
                  }, '') || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Completion</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{completionPercentage}%</span>
                  <Progress value={completionPercentage} size="sm" className="flex-1" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default React.memo(Education);