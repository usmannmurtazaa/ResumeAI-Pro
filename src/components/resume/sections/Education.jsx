import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiTrash2, FiCalendar, FiBook, FiStar,
  FiChevronDown, FiChevronUp, FiCheckCircle, FiAlertCircle,
  FiCopy, FiInfo, FiClock, FiTrendingUp, FiMoreHorizontal,
} from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Card from '../../ui/Card';
import Progress from '../../ui/Progress';
import Tooltip from '../../ui/Tooltip';
import toast from 'react-hot-toast';

// ── Utility Functions (Outside Component) ─────────────────────────────────

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
  if (numGPA >= 3.5) return { text: 'Excellent! Include it', color: 'text-green-500' };
  if (numGPA >= 3.0) return { text: 'Good - include if above 3.0', color: 'text-blue-500' };
  if (numGPA >= 2.5) return { text: 'Optional to include', color: 'text-yellow-500' };
  return { text: 'Consider omitting', color: 'text-orange-500' };
};

const calculateEducationDuration = (startDate, endDate) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months < 0) return null;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} yr ${remainingMonths} mo`;
};

const getHighestDegree = (educations) => {
  const hierarchy = ['phd', 'doctor', 'master', 'bachelor', 'associate'];
  for (const level of hierarchy) {
    if (educations.some(e => e.degree?.toLowerCase().includes(level))) {
      return level === 'phd' || level === 'doctor' ? 'PhD' : 
             level === 'master' ? "Master's" : "Bachelor's";
    }
  }
  return 'N/A';
};

const createEmptyEducation = () => ({
  institution: '', degree: '', field: '', startDate: '', endDate: '',
  gpa: '', achievements: '', honors: '', courses: '',
  thesis: '', advisor: '', description: '',
});

// ── Simple Debounce Hook ──────────────────────────────────────────────────

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedFn = useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return debouncedFn;
};

// ── Component ─────────────────────────────────────────────────────────────

const Education = ({ data = [], onChange, onValidationChange }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [sortOrder, setSortOrder] = useState('date');
  const [viewMode, setViewMode] = useState('detailed');

  const mountedRef = useRef(true);
  const previousDataRef = useRef(data);

  const { register, control, watch, setValue, trigger, formState: { errors, isDirty } } = useForm({
    defaultValues: { education: data?.length ? data : [createEmptyEducation()] },
    mode: 'onChange',
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'education' });
  const watchedFields = watch('education');

  // ── Lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Sync external data changes
  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      previousDataRef.current = data;
      if (data?.length) {
        data.forEach((item, index) => {
          Object.entries(item).forEach(([key, value]) => {
            setValue(`education.${index}.${key}`, value);
          });
        });
      }
    }
  }, [data, setValue]);

  // ── FIXED: Handle Save ────────────────────────────────────────────────

  const handleSave = useCallback((formData) => {
    if (!mountedRef.current) return;

    const sorted = [...(formData || [])].sort((a, b) => {
      if (sortOrder === 'date') {
        return (b.endDate || '9999').localeCompare(a.endDate || '9999');
      }
      if (sortOrder === 'institution') return (a.institution || '').localeCompare(b.institution || '');
      if (sortOrder === 'degree') return (a.degree || '').localeCompare(b.degree || '');
      return 0;
    });

    onChange?.(sorted);
    setAutoSaveStatus('saved');
    setTimeout(() => {
      if (mountedRef.current) setAutoSaveStatus('idle');
    }, 3000);
  }, [sortOrder, onChange]);

  // ── Debounced Auto-Save ───────────────────────────────────────────────

  const debouncedSave = useDebounce(handleSave, 1000);

  useEffect(() => {
    if (isDirty && watchedFields) {
      setAutoSaveStatus('saving');
      debouncedSave(watchedFields);
    }
  }, [watchedFields, isDirty, debouncedSave]);

  // ── Completion Calculation ────────────────────────────────────────────

  useEffect(() => {
    if (!watchedFields) return;
    let total = 0, completed = 0;
    watchedFields.forEach(edu => {
      ['institution', 'degree', 'field', 'startDate'].forEach(field => {
        total++;
        if (edu[field]?.trim()) completed++;
      });
    });
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    setCompletionPercentage(pct);
    onValidationChange?.({ isValid: Object.keys(errors).length === 0, completionPercentage: pct, count: fields.length });
  }, [watchedFields, errors, fields.length, onValidationChange]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const addEducation = useCallback(() => {
    append(createEmptyEducation());
    // Auto-expand the new item
    setExpandedItems(prev => new Set([...prev, fields.length]));
    toast.success('Education entry added');
  }, [append, fields.length]);

  const duplicateEducation = useCallback((index) => {
    const item = { ...watchedFields[index] };
    delete item.id;
    append(item);
    toast.success('Education duplicated');
  }, [watchedFields, append]);

  const removeEducation = useCallback((index) => {
    remove(index);
    toast.success('Education removed');
  }, [remove]);

  const toggleExpand = useCallback((index) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }, []);

  const moveItem = useCallback((from, to) => {
    if (to >= 0 && to < fields.length) {
      move(from, to);
      toast.success('Order updated');
    }
  }, [fields.length, move]);

  // ── FIXED: Currently studying checkbox ────────────────────────────────

  const handleCurrentlyStudying = useCallback((index, checked) => {
    if (checked) {
      setValue(`education.${index}.endDate`, '', { shouldValidate: true });
    }
    // The checkbox state is derived from !edu?.endDate, so setting it to '' makes it checked
  }, [setValue]);

  // ── Animation Variants ────────────────────────────────────────────────

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, scale: 0.95 } };

  // ── Memoized Values ──────────────────────────────────────────────────

  const highestDegree = useMemo(() => getHighestDegree(watchedFields || []), [watchedFields]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">Education</h3>
            {fields.length > 0 && (
              <Badge variant="primary" size="sm">{fields.length} {fields.length === 1 ? 'Entry' : 'Entries'}</Badge>
            )}
            {completionPercentage === 100 && fields.length > 0 && (
              <Badge variant="success"><FiCheckCircle className="w-3 h-3 mr-1" />Complete</Badge>
            )}
          </div>
          {fields.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-xs"><Progress value={completionPercentage} size="sm" showPercentage /></div>
              {autoSaveStatus === 'saved' && (
                <span className="text-xs text-green-500"><FiCheckCircle className="w-3 h-3 inline mr-1" />Saved</span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
            <option value="date">By Date</option>
            <option value="institution">By Institution</option>
            <option value="degree">By Degree</option>
          </select>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['detailed', 'compact'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm rounded-md capitalize ${viewMode === mode ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>
                {mode}
              </button>
            ))}
          </div>
          <Button type="button" variant="primary" onClick={addEducation} icon={<FiPlus />}>Add</Button>
        </div>
      </div>

      {/* Education List */}
      <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
        <AnimatePresence mode="popLayout">
          {fields.map((field, index) => {
            const edu = watchedFields?.[index] || {};
            const duration = calculateEducationDuration(edu.startDate, edu.endDate);
            const gpaFeedback = getGPAFeedback(edu.gpa);
            const isExpanded = expandedItems.has(index) || viewMode === 'detailed';
            const isCurrentlyStudying = !edu.endDate && edu.startDate;

            return (
              <motion.div key={field.id} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout>
                <Card className="relative overflow-hidden">
                  {/* Compact Header */}
                  <div className="p-4 sm:p-6 cursor-pointer" onClick={() => viewMode === 'compact' && toggleExpand(index)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{getEducationLevelIcon(edu.degree)}</span>
                        <div className="min-w-0">
                          <h4 className="font-semibold truncate">{edu.institution || 'New Education'}</h4>
                          {edu.degree && (
                            <p className="text-primary-600 dark:text-primary-400 text-sm truncate">
                              {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                            {edu.startDate && (
                              <span><FiCalendar className="w-3 h-3 inline mr-1" />{edu.startDate} - {edu.endDate || 'Present'}</span>
                            )}
                            {duration && <span><FiClock className="w-3 h-3 inline mr-1" />{duration}</span>}
                            {edu.gpa && <span><FiStar className="w-3 h-3 inline mr-1" />GPA: {edu.gpa}</span>}
                            {isCurrentlyStudying && <Badge variant="warning" size="sm">Current</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button type="button" onClick={e => { e.stopPropagation(); moveItem(index, index - 1); }}
                          disabled={index === 0}
                          className={`p-1 rounded ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                          <FiChevronUp className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={e => { e.stopPropagation(); moveItem(index, index + 1); }}
                          disabled={index === fields.length - 1}
                          className={`p-1 rounded ${index === fields.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                          <FiChevronDown className="w-4 h-4" />
                        </button>
                        {viewMode === 'compact' && (
                          <button type="button" onClick={e => { e.stopPropagation(); toggleExpand(index); }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Form */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="px-4 sm:px-6 pb-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        
                        <div className="flex justify-end gap-2 pt-4">
                          <button type="button" onClick={() => duplicateEducation(index)}
                            className="p-2 text-gray-500 hover:text-primary-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            <FiCopy className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => removeEducation(index)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Input label="Institution" icon={<FiBook />} placeholder="e.g., Harvard University"
                          {...register(`education.${index}.institution`, { required: 'Institution is required' })}
                          error={errors.education?.[index]?.institution?.message} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label="Degree" placeholder="e.g., Bachelor of Science"
                            {...register(`education.${index}.degree`, { required: 'Degree is required' })}
                            error={errors.education?.[index]?.degree?.message} />
                          <Input label="Field of Study" placeholder="e.g., Computer Science"
                            {...register(`education.${index}.field`)} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input label="Start Date" type="month" icon={<FiCalendar />}
                            {...register(`education.${index}.startDate`)} />
                          <div>
                            <Input label="End Date" type="month" icon={<FiCalendar />}
                              disabled={isCurrentlyStudying}
                              {...register(`education.${index}.endDate`)} />
                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                              <input type="checkbox" checked={isCurrentlyStudying}
                                onChange={(e) => handleCurrentlyStudying(index, e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">Currently studying</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <Input label="GPA" placeholder="e.g., 3.8"
                            {...register(`education.${index}.gpa`, {
                              pattern: { value: /^[0-4]\.?\d{0,2}$/, message: 'Invalid GPA format' }
                            })}
                            error={errors.education?.[index]?.gpa?.message} />
                          {gpaFeedback && (
                            <p className={`mt-1 text-xs ${gpaFeedback.color}`}>{gpaFeedback.text}</p>
                          )}
                        </div>

                        <details className="group">
                          <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500">
                            <FiMoreHorizontal className="w-4 h-4" />Advanced Options
                            <FiChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="mt-4 space-y-4 pl-6">
                            <Input label="Thesis/Dissertation" placeholder="e.g., ML Applications in Healthcare"
                              {...register(`education.${index}.thesis`)} />
                            <Input label="Academic Advisor" placeholder="e.g., Dr. Jane Smith"
                              {...register(`education.${index}.advisor`)} />
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Relevant Coursework</label>
                              <textarea {...register(`education.${index}.courses`)} rows={2}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm"
                                placeholder="Data Structures, Algorithms, Machine Learning..." />
                            </div>
                          </div>
                        </details>

                        <div>
                          <label className="block text-sm font-medium mb-2">Honors & Awards</label>
                          <textarea {...register(`education.${index}.honors`)} rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm"
                            placeholder="Dean's List, Summa Cum Laude, Phi Beta Kappa..." />
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <FiBook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No Education Added</h4>
            <p className="text-gray-500 mb-4">Add your educational background</p>
            <Button onClick={addEducation} icon={<FiPlus />}>Add Education</Button>
          </motion.div>
        )}
      </motion.div>

      {/* Education Summary */}
      {fields.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
          <h4 className="font-semibold mb-3"><FiTrendingUp className="w-4 h-4 inline mr-2" />Education Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-gray-500">Institutions</p><p className="text-xl font-bold">{fields.length}</p></div>
            <div><p className="text-gray-500">Highest Degree</p><p className="text-xl font-bold">{highestDegree}</p></div>
            <div><p className="text-gray-500">Completion</p><Progress value={completionPercentage} size="sm" /></div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default React.memo(Education);
