import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiTrash2, FiExternalLink, FiGithub, FiCalendar, FiCode,
  FiStar, FiUsers, FiChevronDown, FiChevronUp, FiCheckCircle,
  FiAlertCircle, FiCopy, FiEye, FiMoreHorizontal, FiZap, FiFolder,
} from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Card from '../../ui/Card';
import Progress from '../../ui/Progress';
import Tooltip from '../../ui/Tooltip';
import Modal from '../../ui/Modal';
import toast from 'react-hot-toast';

// ── Constants (Module Level) ─────────────────────────────────────────────

const PROJECT_TYPES = [
  { id: 'personal', name: 'Personal', icon: '🚀' },
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'open-source', name: 'Open Source', icon: '🌟' },
  { id: 'academic', name: 'Academic', icon: '📚' },
  { id: 'freelance', name: 'Freelance', icon: '🤝' },
  { id: 'hackathon', name: 'Hackathon', icon: '🏆' },
];

const TECH_CATEGORIES = {
  frontend: ['React', 'Vue.js', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux'],
  backend: ['Node.js', 'Python', 'Java', 'Go', 'Rust', 'C#', 'PHP', 'Ruby', 'GraphQL', 'REST API'],
  database: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase', 'Supabase', 'DynamoDB'],
  devops: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Jenkins', 'Terraform', 'Nginx'],
  mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Expo'],
  ai: ['TensorFlow', 'PyTorch', 'OpenAI', 'LangChain', 'Scikit-learn', 'Pandas', 'NumPy'],
};

// ── Utility Functions ────────────────────────────────────────────────────

const getProjectIcon = (type) => PROJECT_TYPES.find(t => t.id === type)?.icon || '📁';

const calculateProjectDuration = (startDate, endDate, isCurrent) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  const end = isCurrent ? new Date() : (endDate ? new Date(endDate) : new Date());
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months < 0) return null;
  if (months === 0) return 'Less than a month';
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} yr ${remainingMonths} mo`;
};

const generateDescriptionTemplate = (name, type) => {
  const templates = {
    personal: `A personal project built to explore and master new technologies. ${name || '[Project]'} demonstrates proficiency in full-stack development and problem-solving.`,
    work: `A key initiative at [Company] that delivered significant business value. ${name || '[Project]'} improved efficiency and received positive feedback.`,
    'open-source': `An open-source contribution that helps developers [solve problem]. ${name || '[Project]'} has garnered community engagement and stars.`,
    hackathon: `A rapid prototype developed during [Hackathon] addressing [problem]. ${name || '[Project]'} won recognition for innovation.`,
    freelance: `A client project delivering custom solutions. ${name || '[Project]'} resulted in measurable improvements in client metrics.`,
    academic: `A research project completed as part of [Course]. ${name || '[Project]'} explores innovative solutions with promising results.`,
  };
  return templates[type] || templates.personal;
};

const createEmptyProject = () => ({
  name: '', description: '', technologies: '', link: '', github: '',
  startDate: '', endDate: '', current: false, type: 'personal',
  role: '', teamSize: '', features: '', challenges: '', outcomes: '', featured: false,
});

// ── Simple Debounce Hook ──────────────────────────────────────────────────

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; }, [callback]);
  const debouncedFn = useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
  }, [delay]);
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  return debouncedFn;
};

// ── Component ─────────────────────────────────────────────────────────────

const Projects = ({ data = [], onChange, onValidationChange }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [viewMode, setViewMode] = useState('detailed');
  const [sortOrder, setSortOrder] = useState('date');
  const [showTechSuggestions, setShowTechSuggestions] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [projectStats, setProjectStats] = useState({ total: 0, featured: 0, withLinks: 0, techCount: 0 });

  const mountedRef = useRef(true);
  const previousDataRef = useRef(data);

  const { register, control, watch, setValue, formState: { errors, isDirty } } = useForm({
    defaultValues: { projects: data?.length ? data : [createEmptyProject()] },
    mode: 'onChange',
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'projects' });
  const watchedFields = watch('projects');

  // ── Lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      previousDataRef.current = data;
      data?.forEach((item, i) => Object.entries(item).forEach(([k, v]) => setValue(`projects.${i}.${k}`, v)));
    }
  }, [data, setValue]);

  // ── FIXED: Handle Save ────────────────────────────────────────────────

  const handleSave = useCallback((formData) => {
    if (!mountedRef.current) return;
    const sorted = [...(formData || [])].sort((a, b) => {
      if (sortOrder === 'date') return (b.current ? '9999' : (b.endDate || b.startDate || '')).localeCompare(a.current ? '9999' : (a.endDate || a.startDate || ''));
      if (sortOrder === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortOrder === 'featured') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return 0;
    });
    onChange?.(sorted);
    setAutoSaveStatus('saved');
    setTimeout(() => { if (mountedRef.current) setAutoSaveStatus('idle'); }, 3000);
  }, [sortOrder, onChange]);

  const debouncedSave = useDebounce(handleSave, 1000);

  useEffect(() => {
    if (isDirty && watchedFields) {
      setAutoSaveStatus('saving');
      debouncedSave(watchedFields);
    }
  }, [watchedFields, isDirty, debouncedSave]);

  // ── Stats & Completion ────────────────────────────────────────────────

  useEffect(() => {
    if (!watchedFields) return;
    let total = 0, completed = 0;
    let featured = 0, withLinks = 0;
    const techSet = new Set();

    watchedFields.forEach(p => {
      ['name', 'description', 'technologies'].forEach(f => { total++; if (p[f]?.trim()) completed++; });
      if (p.featured) featured++;
      if (p.link || p.github) withLinks++;
      if (p.technologies) p.technologies.split(',').forEach(t => techSet.add(t.trim().toLowerCase()));
    });

    setCompletionPercentage(total > 0 ? Math.round((completed / total) * 100) : 0);
    setProjectStats({ total: watchedFields.length, featured, withLinks, techCount: techSet.size });
    onValidationChange?.({ isValid: Object.keys(errors).length === 0, completionPercentage, count: fields.length });
  }, [watchedFields, errors, fields.length, onValidationChange]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const addProject = useCallback(() => { append(createEmptyProject()); toast.success('Project added'); }, [append]);
  const removeProject = useCallback((idx) => { remove(idx); toast.success('Project removed'); }, [remove]);
  const toggleExpand = useCallback((idx) => setExpandedItems(p => { const n = new Set(p); n.has(idx) ? n.delete(idx) : n.add(idx); return n; }), []);
  const toggleFeatured = useCallback((idx) => { const v = watchedFields[idx]?.featured; setValue(`projects.${idx}.featured`, !v); toast.success(v ? 'Removed from featured' : 'Added to featured'); }, [watchedFields, setValue]);
  const moveItem = useCallback((f, t) => { if (t >= 0 && t < fields.length) { move(f, t); toast.success('Order updated'); } }, [fields.length, move]);

  const addTech = useCallback((index, tech) => {
    const current = watchedFields[index]?.technologies || '';
    const arr = current.split(',').map(t => t.trim()).filter(Boolean);
    if (!arr.includes(tech)) {
      arr.push(tech);
      setValue(`projects.${index}.technologies`, arr.join(', '), { shouldValidate: true });
      toast.success(`Added ${tech}`);
    } else {
      toast.error(`${tech} already added`);
    }
  }, [watchedFields, setValue]);

  const handleGenerateDescription = useCallback((index) => {
    const proj = watchedFields[index];
    const desc = generateDescriptionTemplate(proj?.name, proj?.type);
    setValue(`projects.${index}.description`, desc, { shouldValidate: true });
    toast.success('Description generated!');
  }, [watchedFields, setValue]);

  // ── Animation ─────────────────────────────────────────────────────────

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, scale: 0.95 } };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">Projects</h3>
            {fields.length > 0 && <Badge variant="primary" size="sm">{fields.length}</Badge>}
            {projectStats.featured > 0 && <Badge variant="warning" size="sm"><FiStar className="w-3 h-3 mr-1" />{projectStats.featured} Featured</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <Progress value={completionPercentage} size="sm" showPercentage className="max-w-xs" />
            {autoSaveStatus === 'saved' && <span className="text-xs text-green-500"><FiCheckCircle className="w-3 h-3 inline mr-1" />Saved</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="input-field !py-2 !w-auto text-sm">
            <option value="date">Most Recent</option><option value="name">By Name</option><option value="featured">Featured</option>
          </select>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['detailed', 'compact'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1 text-sm rounded-md capitalize ${viewMode === m ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>{m}</button>
            ))}
          </div>
          <Button type="button" variant="primary" onClick={addProject} icon={<FiPlus />}>Add</Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      {fields.length > 0 && (
        <Card className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { value: projectStats.total, label: 'Projects' },
              { value: projectStats.withLinks, label: 'With Links' },
              { value: projectStats.techCount, label: 'Technologies' },
              { value: projectStats.featured, label: 'Featured' },
            ].map((s, i) => (
              <div key={i}><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
            ))}
          </div>
        </Card>
      )}

      {/* Projects List */}
      <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
        <AnimatePresence mode="popLayout">
          {fields.map((field, index) => {
            const proj = watchedFields?.[index] || {};
            const duration = calculateProjectDuration(proj.startDate, proj.endDate, proj.current);
            const isExpanded = expandedItems.has(index) || viewMode === 'detailed';

            return (
              <motion.div key={field.id} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout>
                <Card className={`relative ${proj.featured ? 'ring-2 ring-yellow-400' : ''}`}>
                  {/* Compact Header */}
                  <div className="p-4 cursor-pointer" onClick={() => viewMode === 'compact' && toggleExpand(index)}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-xl flex-shrink-0">
                        {getProjectIcon(proj.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold truncate flex items-center gap-1.5">
                              {proj.name || 'New Project'}
                              {proj.featured && <FiStar className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />}
                            </h4>
                            {proj.role && <p className="text-sm text-gray-500 truncate">{proj.role}</p>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button type="button" onClick={e => { e.stopPropagation(); moveItem(index, index - 1); }}
                              disabled={index === 0} className={`p-1 rounded ${index === 0 ? 'opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                              <FiChevronUp className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={e => { e.stopPropagation(); moveItem(index, index + 1); }}
                              disabled={index === fields.length - 1} className={`p-1 rounded ${index === fields.length - 1 ? 'opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                              <FiChevronDown className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        {proj.technologies && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {proj.technologies.split(',').slice(0, 3).map((t, i) => <Badge key={i} variant="secondary" size="sm">{t.trim()}</Badge>)}
                            {proj.technologies.split(',').length > 3 && <Badge variant="secondary" size="sm">+{proj.technologies.split(',').length - 3}</Badge>}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-primary-500"><FiExternalLink className="w-3 h-3 inline mr-1" />Demo</a>}
                          {proj.github && <a href={proj.github} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-gray-500"><FiGithub className="w-3 h-3 inline mr-1" />GitHub</a>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Form */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="px-4 sm:px-5 pb-5 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex justify-end gap-2 pt-4">
                          <button type="button" onClick={() => toggleFeatured(index)}
                            className={`p-2 rounded-lg ${proj.featured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-500 hover:text-yellow-500'}`}>
                            <FiStar className="w-4 h-4" /></button>
                          <button type="button" onClick={() => { setSelectedProject(proj); setShowPreviewModal(true); }}
                            className="p-2 text-gray-500 hover:text-primary-500 rounded-lg"><FiEye className="w-4 h-4" /></button>
                          <button type="button" onClick={() => { const dup = { ...watchedFields[index] }; delete dup.id; append(dup); }}
                            className="p-2 text-gray-500 hover:text-primary-500 rounded-lg"><FiCopy className="w-4 h-4" /></button>
                          <button type="button" onClick={() => removeProject(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 className="w-4 h-4" /></button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Project Name" placeholder="e.g., E-commerce Platform"
                            {...register(`projects.${index}.name`, { required: 'Required' })} />
                          <div>
                            <label className="block text-sm font-medium mb-2">Type</label>
                            <select {...register(`projects.${index}.type`)} className="input-field">
                              {PROJECT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <Input label="Your Role" placeholder="e.g., Lead Developer" {...register(`projects.${index}.role`)} />
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Description</label>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleGenerateDescription(index)} icon={<FiZap />}>Generate</Button>
                          </div>
                          <textarea {...register(`projects.${index}.description`, { required: 'Required' })} rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Technologies</label>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowTechSuggestions(p => ({ ...p, [index]: !p[index] }))}>Suggest</Button>
                          </div>
                          <Input icon={<FiCode />} placeholder="React, Node.js, PostgreSQL..."
                            {...register(`projects.${index}.technologies`, { required: 'Required' })} />
                          <AnimatePresence>
                            {showTechSuggestions[index] && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-48 overflow-y-auto">
                                {Object.entries(TECH_CATEGORIES).map(([cat, techs]) => (
                                  <div key={cat} className="mb-2">
                                    <p className="text-xs font-medium capitalize mb-1">{cat}</p>
                                    <div className="flex flex-wrap gap-1">
                                      {techs.map(tech => (
                                        <button key={tech} type="button" onClick={() => addTech(index, tech)}
                                          className="px-2 py-0.5 text-xs bg-white dark:bg-gray-700 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20">{tech}</button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Live URL" icon={<FiExternalLink />} placeholder="https://..." {...register(`projects.${index}.link`)} />
                          <Input label="GitHub" icon={<FiGithub />} placeholder="https://github.com/..." {...register(`projects.${index}.github`)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Start Date" type="month" icon={<FiCalendar />} {...register(`projects.${index}.startDate`)} />
                          <div>
                            <Input label="End Date" type="month" icon={<FiCalendar />} disabled={proj.current} {...register(`projects.${index}.endDate`)} />
                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                              <input type="checkbox" {...register(`projects.${index}.current`)} className="rounded border-gray-300 text-primary-600" />
                              <span className="text-sm">Ongoing</span>
                            </label>
                          </div>
                        </div>
                        {duration && <p className="text-sm text-gray-500"><FiCalendar className="w-3 h-3 inline mr-1" />{duration}</p>}
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
            <FiFolder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No Projects</h4>
            <p className="text-gray-500 mb-4">Showcase your work</p>
            <Button onClick={addProject} icon={<FiPlus />}>Add Project</Button>
          </motion.div>
        )}
      </motion.div>

      {/* Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Project Preview">
        {selectedProject && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl">{getProjectIcon(selectedProject.type)}</div>
              <div><h3 className="text-lg font-bold">{selectedProject.name}</h3><p className="text-sm text-gray-500">{selectedProject.role}</p></div>
            </div>
            <p className="text-sm">{selectedProject.description}</p>
            {selectedProject.technologies && (
              <div className="flex flex-wrap gap-1">
                {selectedProject.technologies.split(',').map((t, i) => <Badge key={i} variant="secondary">{t.trim()}</Badge>)}
              </div>
            )}
            <div className="flex gap-2">
              {selectedProject.link && <Button variant="outline" size="sm" onClick={() => window.open(selectedProject.link, '_blank')}><FiExternalLink className="w-4 h-4 mr-1" />Demo</Button>}
              {selectedProject.github && <Button variant="outline" size="sm" onClick={() => window.open(selectedProject.github, '_blank')}><FiGithub className="w-4 h-4 mr-1" />GitHub</Button>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(Projects);
