import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiTrash2, FiCalendar, FiBriefcase, FiMapPin,
  FiChevronDown, FiChevronUp, FiCheckCircle, FiAlertCircle,
  FiCopy, FiClock, FiMoreHorizontal, FiZap, FiInfo, FiTarget,
  FiUsers, FiDollarSign, FiStar, FiTrendingUp, FiAward,
} from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Card from '../../ui/Card';
import Progress from '../../ui/Progress';
import Tooltip from '../../ui/Tooltip';
import toast from 'react-hot-toast';

// ── Constants (Outside Component) ─────────────────────────────────────────

const ACTION_VERBS = {
  leadership: ['Led', 'Managed', 'Directed', 'Supervised', 'Coordinated', 'Spearheaded', 'Orchestrated', 'Headed'],
  achievement: ['Achieved', 'Increased', 'Decreased', 'Improved', 'Reduced', 'Generated', 'Delivered', 'Exceeded'],
  development: ['Developed', 'Created', 'Designed', 'Built', 'Implemented', 'Launched', 'Established', 'Founded'],
  analysis: ['Analyzed', 'Evaluated', 'Assessed', 'Researched', 'Investigated', 'Identified', 'Reviewed', 'Audited'],
  collaboration: ['Collaborated', 'Partnered', 'Facilitated', 'Negotiated', 'Communicated', 'Presented', 'Advised', 'Consulted'],
  optimization: ['Optimized', 'Streamlined', 'Enhanced', 'Automated', 'Restructured', 'Revitalized', 'Transformed', 'Modernized'],
};

const EMPLOYMENT_ICONS = {
  'full-time': '💼', 'part-time': '🕐', 'contract': '📋',
  'freelance': '🚀', 'internship': '🎓', 'volunteer': '🤝',
};

const ATS_TIPS = [
  'Start each bullet with a strong action verb',
  'Include quantifiable results (%, $, #)',
  'Use industry-standard keywords from job descriptions',
  'Keep formatting simple - avoid tables or columns',
  'Aim for 3-5 bullet points per position',
];

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

// ── Utility Functions (Outside Component) ─────────────────────────────────

const calculateDuration = (startDate, endDate, isCurrent) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  const end = isCurrent ? new Date() : (endDate ? new Date(endDate) : new Date());
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months < 0) return null;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} mo${remainingMonths !== 1 ? 's' : ''}`;
  if (remainingMonths === 0) return `${years} yr${years !== 1 ? 's' : ''}`;
  return `${years} yr${years !== 1 ? 's' : ''} ${remainingMonths} mo`;
};

const calculateTotalExperience = (experiences) => {
  if (!experiences?.length) return { years: 0, months: 0 };
  let totalMonths = 0;
  experiences.forEach(exp => {
    if (exp.startDate) {
      const start = new Date(exp.startDate);
      const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      if (months > 0) totalMonths += months;
    }
  });
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
};

const analyzeDescription = (description) => {
  if (!description) return { score: 0, suggestions: [] };
  let score = 0;
  const suggestions = [];
  
  const hasActionVerb = Object.values(ACTION_VERBS).flat().some(verb =>
    description.toLowerCase().includes(verb.toLowerCase())
  );
  if (hasActionVerb) score += 30;
  else suggestions.push('Start bullets with strong action verbs');
  
  const hasMetrics = /(\d+%|\$\d+|\d+\s*(people|users|clients|team)|increased|decreased|reduced|improved)/i.test(description);
  if (hasMetrics) score += 40;
  else suggestions.push('Include quantifiable achievements with numbers');
  
  const words = description.split(/\s+/).filter(Boolean).length;
  if (words >= 30) score += 30;
  else suggestions.push('Add more detail (aim for 30+ words)');
  
  return { score: Math.min(score, 100), suggestions };
};

const generateBullet = (title, company, category) => {
  const verbs = ACTION_VERBS[category] || ACTION_VERBS.achievement;
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const templates = [
    `${verb} ${title?.toLowerCase() || '[title]'} initiatives at ${company || '[Company]'}, resulting in [X]% improvement in [metric].`,
    `${verb} [project] that generated $[X] in revenue and improved [process] by [Y]%.`,
    `${verb} a team of [X] to deliver [project] on time and under budget.`,
    `${verb} and implemented [solution] that reduced costs by [X]% and increased efficiency.`,
    `${verb} cross-functional collaboration to launch [product] serving [X] users.`,
  ];
  return `• ${templates[Math.floor(Math.random() * templates.length)]}`;
};

// ── Empty Experience Template ─────────────────────────────────────────────

const createEmptyExperience = () => ({
  company: '', title: '', location: '', startDate: '', endDate: '',
  current: false, description: '', achievements: [], technologies: [],
  teamSize: '', budget: '', employmentType: 'full-time',
});

// ── Component ─────────────────────────────────────────────────────────────

const Experience = ({ data = [], onChange, onValidationChange }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [viewMode, setViewMode] = useState('detailed');
  const [sortOrder, setSortOrder] = useState('date');
  const [showBulletSuggestions, setShowBulletSuggestions] = useState({});
  const [totalExperience, setTotalExperience] = useState({ years: 0, months: 0 });

  const mountedRef = useRef(true);
  const previousDataRef = useRef(data);

  const { register, control, watch, setValue, trigger, formState: { errors, isDirty } } = useForm({
    defaultValues: { experience: data?.length ? data : [createEmptyExperience()] },
    mode: 'onChange',
  });

  const { fields, append, remove, move, update } = useFieldArray({ control, name: 'experience' });
  const watchedFields = watch('experience');

  // ── Lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Reset form when external data changes
  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      previousDataRef.current = data;
      // Reset form with new data
      if (data?.length) {
        data.forEach((item, index) => {
          Object.entries(item).forEach(([key, value]) => {
            setValue(`experience.${index}.${key}`, value);
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
        const dateA = a.current ? '9999' : (a.endDate || '');
        const dateB = b.current ? '9999' : (b.endDate || '');
        return dateB.localeCompare(dateA);
      }
      if (sortOrder === 'company') return (a.company || '').localeCompare(b.company || '');
      if (sortOrder === 'title') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

    onChange?.(sorted);
    setAutoSaveStatus('saved');
    setTimeout(() => {
      if (mountedRef.current) setAutoSaveStatus('idle');
    }, 3000);
  }, [sortOrder, onChange]);

  // ── FIXED: Debounced Save (Proper Closure) ────────────────────────────

  const debouncedSave = useDebounce(handleSave, 1000);

  // ── FIXED: Auto-save with proper dependency ───────────────────────────

  useEffect(() => {
    if (isDirty && watchedFields) {
      setAutoSaveStatus('saving');
      debouncedSave(watchedFields);
    }
  }, [watchedFields, isDirty, debouncedSave]);

  // ── Completion & Stats ────────────────────────────────────────────────

  useEffect(() => {
    if (!watchedFields) return;
    
    let totalFields = 0, completedFields = 0;
    watchedFields.forEach(exp => {
      ['company', 'title', 'startDate', 'description'].forEach(field => {
        totalFields++;
        if (exp[field]?.trim()) completedFields++;
      });
    });
    
    const pct = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    setCompletionPercentage(pct);
    setTotalExperience(calculateTotalExperience(watchedFields));

    onValidationChange?.({
      isValid: Object.keys(errors).length === 0,
      completionPercentage: pct,
      count: fields.length,
    });
  }, [watchedFields, errors, fields.length, onValidationChange]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const addExperience = useCallback(() => {
    append(createEmptyExperience());
    toast.success('New experience entry added');
  }, [append]);

  const duplicateExperience = useCallback((index) => {
    const item = { ...watchedFields[index] };
    delete item.id;
    append(item);
    toast.success('Experience duplicated');
  }, [watchedFields, append]);

  const removeExperience = useCallback((index) => {
    remove(index);
    toast.success('Experience removed');
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

  const handleGenerateBullet = useCallback((index, category) => {
    const exp = watchedFields[index];
    const bullet = generateBullet(exp?.title, exp?.company, category);
    const currentDesc = exp?.description || '';
    const newDesc = currentDesc ? `${currentDesc}\n${bullet}` : bullet;
    setValue(`experience.${index}.description`, newDesc, { shouldValidate: true });
    setShowBulletSuggestions(prev => ({ ...prev, [index]: false }));
    toast.success('Achievement bullet added!');
  }, [watchedFields, setValue]);

  // ── Animation Variants ────────────────────────────────────────────────

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, scale: 0.95 } };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">Work Experience</h3>
            {fields.length > 0 && (
              <Badge variant="primary" size="sm">{fields.length} {fields.length === 1 ? 'Position' : 'Positions'}</Badge>
            )}
            {totalExperience.years > 0 && (
              <Badge variant="success" size="sm"><FiClock className="w-3 h-3 mr-1" />{totalExperience.years}+ yrs</Badge>
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
            <option value="date">Most Recent</option>
            <option value="company">By Company</option>
            <option value="title">By Title</option>
          </select>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['detailed', 'compact'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm rounded-md capitalize ${viewMode === mode ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>
                {mode}
              </button>
            ))}
          </div>
          <Button type="button" variant="primary" onClick={addExperience} icon={<FiPlus />}>Add</Button>
        </div>
      </div>

      {/* Total Experience Summary */}
      {totalExperience.years > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center gap-4">
            <FiBriefcase className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total Experience</p>
              <p className="text-xl font-bold">
                {totalExperience.years > 0 && `${totalExperience.years} yr${totalExperience.years > 1 ? 's' : ''}`}
                {totalExperience.months > 0 && ` ${totalExperience.months} mo`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Experience List */}
      <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
        <AnimatePresence mode="popLayout">
          {fields.map((field, index) => {
            const exp = watchedFields?.[index] || {};
            const duration = calculateDuration(exp.startDate, exp.endDate, exp.current);
            const analysis = analyzeDescription(exp.description);
            const isExpanded = expandedItems.has(index) || viewMode === 'detailed';

            return (
              <motion.div key={field.id} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout>
                <Card className="relative overflow-hidden">
                  {/* Compact Header */}
                  <div className="p-4 sm:p-6 cursor-pointer" onClick={() => viewMode === 'compact' && toggleExpand(index)}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center text-2xl flex-shrink-0">
                        {EMPLOYMENT_ICONS[exp.employmentType] || '💼'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold truncate">{exp.title || 'New Position'}</h4>
                            <p className="text-primary-600 dark:text-primary-400 text-sm">{exp.company || 'Company Name'}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {[
                              { onClick: () => moveItem(index, index - 1), disabled: index === 0, icon: FiChevronUp },
                              { onClick: () => moveItem(index, index + 1), disabled: index === fields.length - 1, icon: FiChevronDown },
                            ].map((btn, i) => (
                              <button key={i} type="button" onClick={e => { e.stopPropagation(); btn.onClick(); }}
                                disabled={btn.disabled}
                                className={`p-1 rounded ${btn.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <btn.icon className="w-4 h-4" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                          {exp.location && <span><FiMapPin className="w-3 h-3 inline mr-1" />{exp.location}</span>}
                          {exp.startDate && <span><FiCalendar className="w-3 h-3 inline mr-1" />{exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'Present'}</span>}
                          {duration && <span><FiClock className="w-3 h-3 inline mr-1" />{duration}</span>}
                          {exp.employmentType !== 'full-time' && <Badge variant="secondary" size="sm">{exp.employmentType}</Badge>}
                        </div>
                        {!isExpanded && exp.description && (
                          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Form */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="px-4 sm:px-6 pb-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 pt-4">
                          <button type="button" onClick={() => duplicateExperience(index)}
                            className="p-2 text-gray-500 hover:text-primary-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            <FiCopy className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => removeExperience(index)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Form Fields - abbreviated for review */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label="Job Title" icon={<FiBriefcase />} placeholder="e.g., Senior Software Engineer"
                            {...register(`experience.${index}.title`, { required: 'Required' })}
                            error={errors.experience?.[index]?.title?.message} />
                          <Input label="Company" placeholder="e.g., Google"
                            {...register(`experience.${index}.company`, { required: 'Required' })}
                            error={errors.experience?.[index]?.company?.message} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Start Date" type="month" icon={<FiCalendar />}
                            {...register(`experience.${index}.startDate`, { required: 'Required' })} />
                          <div>
                            <Input label="End Date" type="month" icon={<FiCalendar />}
                              disabled={exp.current}
                              {...register(`experience.${index}.endDate`, { required: !exp.current && 'Required' })} />
                            <label className="flex items-center gap-2 mt-2">
                              <input type="checkbox" {...register(`experience.${index}.current`)}
                                className="rounded border-gray-300 text-primary-600" />
                              <span className="text-sm">Currently work here</span>
                            </label>
                          </div>
                        </div>

                        {/* Description with ATS Analysis */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Description & Achievements</label>
                            <div className="flex items-center gap-2">
                              <Badge variant={analysis.score >= 70 ? 'success' : analysis.score >= 40 ? 'warning' : 'error'} size="sm">
                                ATS: {analysis.score}%
                              </Badge>
                              <div className="relative">
                                <Button type="button" variant="ghost" size="sm"
                                  onClick={() => setShowBulletSuggestions(prev => ({ ...prev, [index]: !prev[index] }))}
                                  icon={<FiZap />}>Suggest</Button>
                                <AnimatePresence>
                                  {showBulletSuggestions[index] && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border z-10">
                                      <div className="p-2">
                                        {Object.keys(ACTION_VERBS).map(cat => (
                                          <button key={cat} type="button" onClick={() => handleGenerateBullet(index, cat)}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg capitalize">
                                            {cat} Verbs
                                          </button>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                          <textarea {...register(`experience.${index}.description`, { required: 'Required' })} rows={5}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm font-mono"
                            placeholder="• Led development of [project] resulting in [X]% improvement..." />
                          {analysis.suggestions.length > 0 && (
                            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">Suggestions:</p>
                              <ul className="text-xs text-yellow-600 dark:text-yellow-300 space-y-0.5">
                                {analysis.suggestions.map((s, i) => <li key={i}>• {s}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* ATS Tips */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">ATS Tips</p>
                          <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-0.5">
                            {ATS_TIPS.map((tip, i) => <li key={i}>• {tip}</li>)}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <FiBriefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No Work Experience</h4>
            <p className="text-gray-500 mb-4">Add your professional experience to showcase your career</p>
            <Button onClick={addExperience} icon={<FiPlus />}>Add Experience</Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default React.memo(Experience);
