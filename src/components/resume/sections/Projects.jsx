import React, { useState, useEffect, useCallback } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiTrash2, 
  FiLink, 
  FiGithub,
  FiExternalLink,
  FiCalendar,
  FiCode,
  FiStar,
  FiUsers,
  FiTarget,
  FiAward,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiAlertCircle,
  FiCopy,
  FiEdit2,
  FiSave,
  FiMoreHorizontal,
  FiGrid,
  FiList,
  FiInfo,
  FiTrendingUp,
  FiZap,
  FiEye,
  FiGitBranch,
  FiTag,
  FiFolder
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

// Project categories and types
const projectTypes = [
  { id: 'personal', name: 'Personal Project', icon: '🚀' },
  { id: 'work', name: 'Work Project', icon: '💼' },
  { id: 'open-source', name: 'Open Source', icon: '🌟' },
  { id: 'academic', name: 'Academic', icon: '📚' },
  { id: 'freelance', name: 'Freelance', icon: '🤝' },
  { id: 'hackathon', name: 'Hackathon', icon: '🏆' }
];

// Technology categories for suggestions
const techCategories = {
  frontend: ['React', 'Vue.js', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux'],
  backend: ['Node.js', 'Python', 'Java', 'Go', 'Rust', 'C#', 'PHP', 'Ruby', 'GraphQL', 'REST API'],
  database: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase', 'Supabase', 'DynamoDB'],
  devops: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Jenkins', 'Terraform', 'Nginx'],
  mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Expo'],
  ai: ['TensorFlow', 'PyTorch', 'OpenAI', 'LangChain', 'Scikit-learn', 'Pandas', 'NumPy', 'Computer Vision']
};

const Projects = ({ data = [], onChange, onValidationChange }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [viewMode, setViewMode] = useState('detailed');
  const [sortOrder, setSortOrder] = useState('date');
  const [showTechSuggestions, setShowTechSuggestions] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [projectStats, setProjectStats] = useState({
    total: 0,
    featured: 0,
    withLinks: 0,
    techStack: new Set()
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
      projects: data?.length ? data : [{
        name: '',
        description: '',
        technologies: '',
        link: '',
        github: '',
        startDate: '',
        endDate: '',
        current: false,
        type: 'personal',
        role: '',
        teamSize: '',
        features: '',
        challenges: '',
        outcomes: '',
        featured: false
      }]
    },
    mode: 'onChange'
  });

  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: 'projects'
  });

  const watchedFields = watch('projects');

  // Calculate completion and stats
  useEffect(() => {
    calculateCompletion();
    calculateProjectStats();
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

    watchedFields.forEach((proj) => {
      const requiredFields = ['name', 'description', 'technologies'];
      requiredFields.forEach(field => {
        totalFields++;
        if (proj[field]?.trim()) completedFields++;
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

  const calculateProjectStats = () => {
    if (!watchedFields) return;

    const stats = {
      total: watchedFields.length,
      featured: watchedFields.filter(p => p.featured).length,
      withLinks: watchedFields.filter(p => p.link || p.github).length,
      techStack: new Set()
    };

    watchedFields.forEach(proj => {
      if (proj.technologies) {
        proj.technologies.split(',').forEach(tech => {
          stats.techStack.add(tech.trim().toLowerCase());
        });
      }
    });

    setProjectStats(stats);
  };

  const handleSave = (formData) => {
    const sortedProjects = sortProjects(formData);
    onChange(sortedProjects);
    setAutoSaveStatus('saved');
    setTimeout(() => setAutoSaveStatus('idle'), 3000);
  };

  const sortProjects = (projectsArray) => {
    if (!projectsArray) return [];
    
    return [...projectsArray].sort((a, b) => {
      switch (sortOrder) {
        case 'date':
          const dateA = a.current ? '9999' : (a.endDate || a.startDate || '');
          const dateB = b.current ? '9999' : (b.endDate || b.startDate || '');
          return dateB.localeCompare(dateA);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'featured':
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        default:
          return 0;
      }
    });
  };

  const addProject = () => {
    append({
      name: '',
      description: '',
      technologies: '',
      link: '',
      github: '',
      startDate: '',
      endDate: '',
      current: false,
      type: 'personal',
      role: '',
      teamSize: '',
      features: '',
      challenges: '',
      outcomes: '',
      featured: false
    });
    toast.success('New project added');
  };

  const duplicateProject = (index) => {
    const itemToDuplicate = { ...watchedFields[index] };
    delete itemToDuplicate.id;
    append(itemToDuplicate);
    toast.success('Project duplicated');
  };

  const removeProject = (index) => {
    remove(index);
    toast.success('Project removed');
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
    
    if (months === 0) return 'Less than a month';
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) return `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  };

  const addTechnologySuggestion = (index, tech) => {
    const currentTech = watchedFields[index]?.technologies || '';
    const techArray = currentTech.split(',').map(t => t.trim()).filter(t => t);
    
    if (!techArray.includes(tech)) {
      techArray.push(tech);
      setValue(`projects.${index}.technologies`, techArray.join(', '));
      toast.success(`Added ${tech} to technologies`);
    } else {
      toast.error(`${tech} already added`);
    }
  };

  const generateDescriptionSuggestion = (index) => {
    const proj = watchedFields[index];
    const name = proj?.name || '[Project Name]';
    const type = proj?.type || 'personal';
    
    const templates = {
      personal: `A personal project built to explore and master new technologies. ${name} demonstrates proficiency in full-stack development and problem-solving skills.`,
      work: `A key initiative at [Company] that delivered significant business value. ${name} improved efficiency by [X]% and received positive stakeholder feedback.`,
      'open-source': `An open-source contribution that helps developers [solve specific problem]. ${name} has garnered [X] stars and active community engagement.`,
      academic: `A research-focused project completed as part of [Course/Degree]. ${name} explores innovative solutions in [field] with promising results.`,
      freelance: `A client project delivering custom solutions tailored to specific business needs. ${name} resulted in [X]% improvement in client metrics.`,
      hackathon: `A rapid-prototype developed during [Hackathon Name] that addresses [problem]. ${name} won [award/recognition] for innovation and technical execution.`
    };
    
    const suggestion = templates[type] || templates.personal;
    setValue(`projects.${index}.description`, suggestion);
    toast.success('Description template generated!');
  };

  const getProjectTypeIcon = (type) => {
    const projectType = projectTypes.find(t => t.id === type);
    return projectType?.icon || '📁';
  };

  const moveItem = (from, to) => {
    if (to >= 0 && to < fields.length) {
      move(from, to);
      toast.success('Project order updated');
    }
  };

  const toggleFeatured = (index) => {
    const currentValue = watchedFields[index]?.featured || false;
    setValue(`projects.${index}.featured`, !currentValue);
    toast.success(currentValue ? 'Removed from featured' : 'Added to featured');
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
            <h3 className="text-xl font-semibold">Projects</h3>
            {fields.length > 0 && (
              <Badge variant="primary" size="sm">
                {fields.length} {fields.length === 1 ? 'Project' : 'Projects'}
              </Badge>
            )}
            {projectStats.featured > 0 && (
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <FiStar className="w-3 h-3" />
                {projectStats.featured} Featured
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
            <option value="featured">Featured First</option>
          </select>

          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                viewMode === 'detailed' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
              }`}
            >
              <FiList className="w-4 h-4 inline mr-1" />
              Detailed
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                viewMode === 'compact' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
              }`}
            >
              <FiGrid className="w-4 h-4 inline mr-1" />
              Compact
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={addProject}
            icon={<FiPlus />}
          >
            Add Project
          </Button>
        </div>
      </div>

      {/* Project Stats Dashboard */}
      {fields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{projectStats.total}</p>
                <p className="text-xs text-gray-500">Total Projects</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{projectStats.withLinks}</p>
                <p className="text-xs text-gray-500">With Links</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{projectStats.techStack.size}</p>
                <p className="text-xs text-gray-500">Technologies</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{projectStats.featured}</p>
                <p className="text-xs text-gray-500">Featured</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Projects List */}
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
            {fields.map((field, index) => {
              const proj = watchedFields[index];
              const duration = calculateDuration(proj?.startDate, proj?.endDate, proj?.current);
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
                  <Card className={`
                    relative overflow-hidden h-full
                    ${proj?.featured ? 'ring-2 ring-yellow-400 dark:ring-yellow-600' : ''}
                    ${!isExpanded && viewMode !== 'grid' ? 'cursor-pointer' : ''}
                  `}>
                    {/* Compact/Grid View */}
                    <div 
                      className="p-4 sm:p-5"
                      onClick={() => viewMode !== 'grid' && viewMode === 'compact' && toggleExpand(index)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-xl">
                            {getProjectTypeIcon(proj?.type)}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold truncate flex items-center gap-2">
                                {proj?.name || 'New Project'}
                                {proj?.featured && (
                                  <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
                                )}
                              </h4>
                              {proj?.role && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {proj.role}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {viewMode !== 'grid' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveItem(index, index - 1);
                                    }}
                                    disabled={index === 0}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      index === 0 
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
                                      moveItem(index, index + 1);
                                    }}
                                    disabled={index === fields.length - 1}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      index === fields.length - 1
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
                                    toggleExpand(index);
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
                                    toggleExpand(index);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                  {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Technologies Preview */}
                          {proj?.technologies && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {proj.technologies.split(',').slice(0, 3).map((tech, i) => (
                                <Badge key={i} variant="secondary" size="sm">
                                  {tech.trim()}
                                </Badge>
                              ))}
                              {proj.technologies.split(',').length > 3 && (
                                <Badge variant="secondary" size="sm">
                                  +{proj.technologies.split(',').length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Description Preview */}
                          {!isExpanded && proj?.description && viewMode !== 'grid' && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {proj.description}
                            </p>
                          )}

                          {/* Links */}
                          <div className="flex items-center gap-3 mt-2">
                            {proj?.link && (
                              <a
                                href={proj.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FiExternalLink className="w-3 h-3" />
                                Live Demo
                              </a>
                            )}
                            {proj?.github && (
                              <a
                                href={proj.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FiGithub className="w-3 h-3" />
                                GitHub
                              </a>
                            )}
                          </div>
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
                            <Tooltip content={proj?.featured ? 'Remove from featured' : 'Mark as featured'}>
                              <button
                                type="button"
                                onClick={() => toggleFeatured(index)}
                                className={`p-2 rounded-lg transition-colors ${
                                  proj?.featured
                                    ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                    : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                }`}
                              >
                                <FiStar className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Preview project">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProject(proj);
                                  setShowPreviewModal(true);
                                }}
                                className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Duplicate project">
                              <button
                                type="button"
                                onClick={() => duplicateProject(index)}
                                className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              >
                                <FiCopy className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Remove project">
                              <button
                                type="button"
                                onClick={() => removeProject(index)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>

                          {/* Form Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Project Name"
                              placeholder="e.g., E-commerce Platform"
                              {...register(`projects.${index}.name`, { required: 'Project name is required' })}
                              error={errors.projects?.[index]?.name?.message}
                            />
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Project Type
                              </label>
                              <select
                                {...register(`projects.${index}.type`)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                              >
                                {projectTypes.map(type => (
                                  <option key={type.id} value={type.id}>
                                    {type.icon} {type.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <Input
                            label="Your Role"
                            placeholder="e.g., Lead Developer, Full-stack Engineer"
                            {...register(`projects.${index}.role`)}
                          />

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Description
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => generateDescriptionSuggestion(index)}
                                icon={<FiZap />}
                              >
                                Generate
                              </Button>
                            </div>
                            <textarea
                              {...register(`projects.${index}.description`, { required: 'Description is required' })}
                              rows={4}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                              placeholder="Describe the project, your contributions, and the outcomes..."
                            />
                            {errors.projects?.[index]?.description && (
                              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                <FiAlertCircle className="w-3 h-3" />
                                {errors.projects[index].description.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Technologies Used
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowTechSuggestions({
                                  ...showTechSuggestions,
                                  [index]: !showTechSuggestions[index]
                                })}
                              >
                                Suggestions
                              </Button>
                            </div>
                            
                            <Input
                              icon={<FiCode />}
                              placeholder="e.g., React, Node.js, PostgreSQL, AWS"
                              {...register(`projects.${index}.technologies`, { required: 'Technologies are required' })}
                              error={errors.projects?.[index]?.technologies?.message}
                            />
                            
                            {/* Technology Suggestions */}
                            <AnimatePresence>
                              {showTechSuggestions[index] && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                  <p className="text-xs text-gray-500 mb-2">Click to add technology:</p>
                                  {Object.entries(techCategories).map(([category, techs]) => (
                                    <div key={category} className="mb-2">
                                      <p className="text-xs font-medium capitalize mb-1">{category}</p>
                                      <div className="flex flex-wrap gap-1">
                                        {techs.slice(0, 5).map(tech => (
                                          <button
                                            key={tech}
                                            type="button"
                                            onClick={() => addTechnologySuggestion(index, tech)}
                                            className="px-2 py-1 text-xs bg-white dark:bg-gray-700 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                          >
                                            {tech}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Live Demo URL"
                              icon={<FiExternalLink />}
                              placeholder="https://project-demo.com"
                              {...register(`projects.${index}.link`, {
                                pattern: {
                                  value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                                  message: 'Invalid URL'
                                }
                              })}
                              error={errors.projects?.[index]?.link?.message}
                            />
                            
                            <Input
                              label="GitHub Repository"
                              icon={<FiGithub />}
                              placeholder="https://github.com/username/project"
                              {...register(`projects.${index}.github`)}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="Start Date"
                              type="month"
                              icon={<FiCalendar />}
                              {...register(`projects.${index}.startDate`)}
                            />
                            
                            <div>
                              <Input
                                label="End Date"
                                type="month"
                                icon={<FiCalendar />}
                                disabled={proj?.current}
                                {...register(`projects.${index}.endDate`)}
                              />
                              <label className="flex items-center gap-2 mt-2">
                                <input
                                  type="checkbox"
                                  {...register(`projects.${index}.current`)}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Ongoing project
                                </span>
                              </label>
                            </div>
                          </div>

                          {duration && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <FiCalendar className="w-3 h-3" />
                              Duration: {duration}
                            </p>
                          )}

                          {/* Advanced Fields */}
                          <details className="group">
                            <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500">
                              <FiMoreHorizontal className="w-4 h-4" />
                              Advanced Details
                              <FiChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                            </summary>
                            
                            <div className="mt-4 space-y-4 pl-6">
                              <Input
                                label="Team Size"
                                type="number"
                                icon={<FiUsers />}
                                placeholder="e.g., 3"
                                {...register(`projects.${index}.teamSize`)}
                              />
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Key Features
                                </label>
                                <textarea
                                  {...register(`projects.${index}.features`)}
                                  rows={2}
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                                  placeholder="List key features of the project..."
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Challenges & Solutions
                                </label>
                                <textarea
                                  {...register(`projects.${index}.challenges`)}
                                  rows={2}
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                                  placeholder="Describe technical challenges and how you solved them..."
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Outcomes & Impact
                                </label>
                                <textarea
                                  {...register(`projects.${index}.outcomes`)}
                                  rows={2}
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                                  placeholder="What were the results? Include metrics if possible..."
                                />
                              </div>
                            </div>
                          </details>
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
              <FiFolder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">No Projects Added</h4>
              <p className="text-gray-500 mb-4">
                Showcase your best work by adding personal, work, or open-source projects
              </p>
              <Button onClick={addProject} icon={<FiPlus />}>
                Add Your First Project
              </Button>
            </motion.div>
          )}
        </motion.div>
      </form>

      {/* Project Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Project Preview"
        size="lg"
      >
        {selectedProject && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-2xl">
                {getProjectTypeIcon(selectedProject.type)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{selectedProject.name}</h3>
                {selectedProject.role && (
                  <p className="text-primary-600 dark:text-primary-400">{selectedProject.role}</p>
                )}
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300">{selectedProject.description}</p>
            
            {selectedProject.technologies && (
              <div>
                <p className="font-medium mb-2">Technologies</p>
                <div className="flex flex-wrap gap-1">
                  {selectedProject.technologies.split(',').map((tech, i) => (
                    <Badge key={i} variant="secondary">{tech.trim()}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              {selectedProject.link && (
                <Button variant="outline" onClick={() => window.open(selectedProject.link, '_blank')}>
                  <FiExternalLink className="w-4 h-4 mr-2" />
                  View Live Demo
                </Button>
              )}
              {selectedProject.github && (
                <Button variant="outline" onClick={() => window.open(selectedProject.github, '_blank')}>
                  <FiGithub className="w-4 h-4 mr-2" />
                  View GitHub
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(Projects);