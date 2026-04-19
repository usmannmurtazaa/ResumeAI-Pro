import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiX, 
  FiSearch, 
  FiCode, 
  FiUsers, 
  FiGlobe,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiStar,
  FiInfo,
  FiSave,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiZap,
  FiFilter,
  FiGrid,
  FiList,
  FiBarChart2,
  FiAward,
  FiTarget,
  FiBookmark,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiMoreHorizontal
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
import { suggestKeywords, industryKeywords, getKeywordCategories } from '../../../utils/atsKeywords';

// Skill proficiency levels
const proficiencyLevels = [
  { value: 'beginner', label: 'Beginner', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { value: 'intermediate', label: 'Intermediate', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { value: 'advanced', label: 'Advanced', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { value: 'expert', label: 'Expert', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' }
];

// Language proficiency levels
const languageLevels = [
  'Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'
];

// Predefined skill categories with popular skills
const skillCategories = {
  technical: {
    'Programming Languages': ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift'],
    'Frontend': ['React', 'Vue.js', 'Angular', 'Next.js', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux', 'Webpack'],
    'Backend': ['Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'FastAPI', 'GraphQL', 'REST API'],
    'Database': ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase', 'Supabase', 'DynamoDB'],
    'DevOps & Cloud': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Jenkins', 'Terraform', 'CI/CD', 'Nginx'],
    'Data Science': ['Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'Tableau'],
    'Mobile': ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin', 'Expo'],
    'Testing': ['Jest', 'Cypress', 'Selenium', 'JUnit', 'PyTest', 'Mocha', 'Testing Library']
  },
  soft: {
    'Leadership': ['Team Leadership', 'Project Management', 'Strategic Planning', 'Decision Making', 'Mentoring'],
    'Communication': ['Public Speaking', 'Technical Writing', 'Presentation', 'Negotiation', 'Active Listening'],
    'Problem Solving': ['Critical Thinking', 'Analytical Skills', 'Creative Problem Solving', 'Research', 'Troubleshooting'],
    'Collaboration': ['Teamwork', 'Cross-functional Collaboration', 'Stakeholder Management', 'Conflict Resolution'],
    'Adaptability': ['Flexibility', 'Quick Learner', 'Resilience', 'Time Management', 'Prioritization'],
    'Business': ['Product Management', 'Agile Methodology', 'Scrum', 'Customer Focus', 'Business Analysis']
  }
};

const Skills = ({ data = {}, onChange, onValidationChange }) => {
  const [newSkill, setNewSkill] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('technical');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState('technology');
  const [expandedSections, setExpandedSections] = useState({ technical: true, soft: true, languages: true });
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [skillStats, setSkillStats] = useState({ total: 0, technical: 0, soft: 0, languages: 0 });
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState(new Set());
  const [skillProficiency, setSkillProficiency] = useState({});
  
  const { handleSubmit, setValue, watch, trigger, formState: { isDirty } } = useForm({
    defaultValues: {
      technical: data?.technical || [],
      soft: data?.soft || [],
      languages: data?.languages || [],
      skillDetails: data?.skillDetails || {}
    }
  });

  const technicalSkills = watch('technical') || [];
  const softSkills = watch('soft') || [];
  const languages = watch('languages') || [];
  const skillDetails = watch('skillDetails') || {};

  // Calculate statistics
  useEffect(() => {
    const stats = {
      total: technicalSkills.length + softSkills.length + languages.length,
      technical: technicalSkills.length,
      soft: softSkills.length,
      languages: languages.length
    };
    setSkillStats(stats);
    
    // Validate minimum requirements
    const isValid = stats.technical >= 5 && stats.soft >= 3;
    onValidationChange?.({
      isValid,
      technicalCount: stats.technical,
      softCount: stats.soft,
      languagesCount: stats.languages,
      totalCount: stats.total
    });
  }, [technicalSkills, softSkills, languages, onValidationChange]);

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
      debouncedSave({ technical: technicalSkills, soft: softSkills, languages, skillDetails });
    }
  }, [technicalSkills, softSkills, languages, skillDetails, isDirty]);

  const handleSave = (formData) => {
    onChange(formData);
    setAutoSaveStatus('saved');
    setTimeout(() => setAutoSaveStatus('idle'), 3000);
  };

  const onSubmit = (formData) => {
    onChange(formData);
  };

  const addSkill = (category) => {
    if (!newSkill.trim()) {
      toast.error('Please enter a skill');
      return;
    }
    
    const currentSkills = watch(category) || [];
    const skillName = newSkill.trim();
    
    if (!currentSkills.includes(skillName)) {
      setValue(category, [...currentSkills, skillName]);
      
      // Initialize proficiency if not set
      if (!skillDetails[skillName]) {
        setValue(`skillDetails.${skillName}`, {
          proficiency: category === 'languages' ? 'Intermediate' : 'intermediate',
          category,
          yearsOfExperience: '',
          lastUsed: ''
        });
      }
      
      handleSubmit(onSubmit)();
      toast.success(`Added ${skillName} to ${category} skills`);
    } else {
      toast.error('This skill already exists');
    }
    setNewSkill('');
  };

  const addMultipleSkills = (skills, category) => {
    const currentSkills = watch(category) || [];
    const newSkills = skills.filter(skill => !currentSkills.includes(skill));
    
    if (newSkills.length > 0) {
      setValue(category, [...currentSkills, ...newSkills]);
      
      newSkills.forEach(skill => {
        if (!skillDetails[skill]) {
          setValue(`skillDetails.${skill}`, {
            proficiency: category === 'languages' ? 'Intermediate' : 'intermediate',
            category,
            yearsOfExperience: '',
            lastUsed: ''
          });
        }
      });
      
      handleSubmit(onSubmit)();
      toast.success(`Added ${newSkills.length} skills to ${category}`);
    } else {
      toast.error('All selected skills already exist');
    }
  };

  const removeSkill = (category, skillToRemove) => {
    const currentSkills = watch(category) || [];
    setValue(category, currentSkills.filter(skill => skill !== skillToRemove));
    
    // Remove from selected skills
    const newSelected = new Set(selectedSkills);
    newSelected.delete(skillToRemove);
    setSelectedSkills(newSelected);
    
    handleSubmit(onSubmit)();
    toast.success(`Removed ${skillToRemove}`);
  };

  const removeSelectedSkills = () => {
    if (selectedSkills.size === 0) {
      toast.error('No skills selected');
      return;
    }

    ['technical', 'soft', 'languages'].forEach(category => {
      const currentSkills = watch(category) || [];
      const filtered = currentSkills.filter(skill => !selectedSkills.has(skill));
      setValue(category, filtered);
    });
    
    setSelectedSkills(new Set());
    handleSubmit(onSubmit)();
    toast.success(`Removed ${selectedSkills.size} skills`);
  };

  const toggleSkillSelection = (skill) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skill)) {
      newSelected.delete(skill);
    } else {
      newSelected.add(skill);
    }
    setSelectedSkills(newSelected);
  };

  const selectAllSkills = (category) => {
    const skills = watch(category) || [];
    const newSelected = new Set(selectedSkills);
    skills.forEach(skill => newSelected.add(skill));
    setSelectedSkills(newSelected);
  };

  const clearSelection = () => {
    setSelectedSkills(new Set());
  };

  const getSuggestions = () => {
    const currentSkills = [...technicalSkills, ...softSkills];
    const suggested = suggestKeywords(selectedIndustry, currentSkills);
    setSuggestions(suggested.slice(0, 15));
    setShowSuggestionsModal(true);
  };

  const addSuggestion = (skill) => {
    if (!technicalSkills.includes(skill)) {
      setValue('technical', [...technicalSkills, skill]);
      
      if (!skillDetails[skill]) {
        setValue(`skillDetails.${skill}`, {
          proficiency: 'intermediate',
          category: 'technical',
          yearsOfExperience: '',
          lastUsed: ''
        });
      }
      
      handleSubmit(onSubmit)();
      setSuggestions(suggestions.filter(s => s !== skill));
      toast.success(`Added ${skill} to technical skills`);
    }
  };

  const updateSkillProficiency = (skill, proficiency) => {
    setValue(`skillDetails.${skill}.proficiency`, proficiency);
    setSkillProficiency(prev => ({ ...prev, [skill]: proficiency }));
    handleSubmit(onSubmit)();
  };

  const updateSkillDetails = (skill, field, value) => {
    setValue(`skillDetails.${skill}.${field}`, value);
    handleSubmit(onSubmit)();
  };

  const importSkillsFromJobDescription = () => {
    // Simulate importing skills from job description
    const mockImportedSkills = {
      technical: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
      soft: ['Team Leadership', 'Problem Solving', 'Communication']
    };
    
    setValue('technical', [...new Set([...technicalSkills, ...mockImportedSkills.technical])]);
    setValue('soft', [...new Set([...softSkills, ...mockImportedSkills.soft])]);
    
    mockImportedSkills.technical.forEach(skill => {
      if (!skillDetails[skill]) {
        setValue(`skillDetails.${skill}`, {
          proficiency: 'intermediate',
          category: 'technical',
          yearsOfExperience: '',
          lastUsed: ''
        });
      }
    });
    
    handleSubmit(onSubmit)();
    setShowImportModal(false);
    toast.success('Skills imported from job description!');
  };

  const exportSkills = () => {
    const data = {
      technical: technicalSkills,
      soft: softSkills,
      languages,
      skillDetails
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skills-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Skills exported successfully!');
  };

  const getFilteredSkills = (skills, category) => {
    if (!searchTerm) return skills;
    return skills.filter(skill => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getProficiencyColor = (proficiency) => {
    const level = proficiencyLevels.find(l => l.value === proficiency);
    return level?.color || 'text-gray-500';
  };

  const SkillItem = ({ skill, category }) => {
    const details = skillDetails[skill] || {};
    const isSelected = selectedSkills.has(skill);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`
          relative group p-3 rounded-xl border transition-all duration-200
          ${isSelected 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50'
          }
          hover:shadow-md
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSkillSelection(skill)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="font-medium">{skill}</span>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip content="Remove skill">
              <button
                type="button"
                onClick={() => removeSkill(category, skill)}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>
        
        {/* Proficiency Selector */}
        <div className="mt-2">
          <select
            value={details.proficiency || (category === 'languages' ? 'Intermediate' : 'intermediate')}
            onChange={(e) => updateSkillProficiency(skill, e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            {(category === 'languages' ? languageLevels : proficiencyLevels.map(l => l.label)).map(level => (
              <option key={level} value={level.toLowerCase()}>{level}</option>
            ))}
          </select>
        </div>
        
        {/* Experience Badge */}
        {details.yearsOfExperience && (
          <Badge size="sm" variant="secondary" className="mt-1">
            {details.yearsOfExperience} {details.yearsOfExperience === '1' ? 'year' : 'years'}
          </Badge>
        )}
      </motion.div>
    );
  };

  const SkillSection = ({ title, skills, category, icon: Icon, color }) => {
    const isExpanded = expandedSections[category];
    const filteredSkills = getFilteredSkills(skills, category);
    
    return (
      <Card className="overflow-hidden">
        <div 
          className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          onClick={() => toggleSection(category)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-sm text-gray-500">
                  {skills.length} skill{skills.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {skills.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectAllSkills(category);
                  }}
                >
                  Select All
                </Button>
              )}
              {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 sm:px-5 pb-5"
            >
              {/* Add Skill Input */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Input
                    placeholder={`Add a ${category} skill...`}
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(category);
                      }
                    }}
                  />
                  
                  {/* Quick Add Suggestions */}
                  {newSkill && category === 'technical' && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 max-h-48 overflow-y-auto">
                      {Object.values(skillCategories.technical)
                        .flat()
                        .filter(s => s.toLowerCase().includes(newSkill.toLowerCase()))
                        .slice(0, 5)
                        .map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => {
                              setNewSkill(skill);
                              addSkill(category);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          >
                            {skill}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                
                <Button
                  type="button"
                  onClick={() => addSkill(category)}
                  icon={<FiPlus />}
                >
                  Add
                </Button>
              </div>
              
              {/* Skills Display */}
              {filteredSkills.length > 0 ? (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' 
                  : 'space-y-2'
                }>
                  <AnimatePresence>
                    {filteredSkills.map((skill) => (
                      <SkillItem key={skill} skill={skill} category={category} />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No {category} skills added yet</p>
                  {category === 'technical' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={getSuggestions}
                      className="mt-2"
                    >
                      Get ATS Suggestions
                    </Button>
                  )}
                </div>
              )}
              
              {/* Category Quick Add */}
              {category === 'technical' && skillCategories.technical && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-primary-600 hover:text-primary-700">
                    Quick add from categories
                  </summary>
                  <div className="mt-3 space-y-3">
                    {Object.entries(skillCategories.technical).map(([catName, catSkills]) => (
                      <div key={catName}>
                        <p className="text-xs font-medium text-gray-500 mb-1">{catName}</p>
                        <div className="flex flex-wrap gap-1">
                          {catSkills.slice(0, 5).map(skill => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => {
                                if (!technicalSkills.includes(skill)) {
                                  setValue('technical', [...technicalSkills, skill]);
                                  handleSubmit(onSubmit)();
                                }
                              }}
                              disabled={technicalSkills.includes(skill)}
                              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                technicalSkills.includes(skill)
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">Skills</h3>
            <Badge variant="primary" size="sm">
              {skillStats.total} Total
            </Badge>
            {skillStats.technical >= 5 && skillStats.soft >= 3 && (
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" />
                Optimized
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <FiCode className="w-4 h-4" />
              Technical: {skillStats.technical}
            </span>
            <span className="flex items-center gap-1">
              <FiUsers className="w-4 h-4" />
              Soft: {skillStats.soft}
            </span>
            <span className="flex items-center gap-1">
              <FiGlobe className="w-4 h-4" />
              Languages: {skillStats.languages}
            </span>
            {autoSaveStatus === 'saved' && (
              <span className="text-green-500 flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" />
                Saved
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
              }`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
              }`}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Selection Actions */}
          {selectedSkills.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="primary">{selectedSkills.size} selected</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
              >
                Clear
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={removeSelectedSkills}
                icon={<FiTrash2 />}
              >
                Remove
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <Button
            type="button"
            variant="outline"
            onClick={getSuggestions}
            icon={<FiSearch />}
          >
            ATS Suggestions
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowImportModal(true)}
            icon={<FiUpload />}
          >
            Import
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={exportSkills}
            icon={<FiDownload />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Skills Progress Overview */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{skillStats.technical}</div>
            <p className="text-xs text-gray-500">Technical Skills</p>
            <Progress 
              value={Math.min((skillStats.technical / 10) * 100, 100)} 
              size="sm" 
              className="mt-1"
            />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{skillStats.soft}</div>
            <p className="text-xs text-gray-500">Soft Skills</p>
            <Progress 
              value={Math.min((skillStats.soft / 5) * 100, 100)} 
              size="sm" 
              className="mt-1"
            />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{skillStats.languages}</div>
            <p className="text-xs text-gray-500">Languages</p>
            <Progress 
              value={Math.min((skillStats.languages / 3) * 100, 100)} 
              size="sm" 
              className="mt-1"
            />
          </div>
        </div>
        
        {skillStats.technical < 5 && (
          <p className="text-xs text-yellow-600 mt-3 flex items-center gap-1">
            <FiAlertCircle className="w-3 h-3" />
            Add at least 5 technical skills for better ATS optimization
          </p>
        )}
      </Card>

      {/* Skills Sections */}
      <form onChange={handleSubmit(onSubmit)} className="space-y-4">
        <SkillSection 
          title="Technical Skills" 
          skills={technicalSkills} 
          category="technical"
          icon={FiCode}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
        />
        
        <SkillSection 
          title="Soft Skills" 
          skills={softSkills} 
          category="soft"
          icon={FiUsers}
          color="bg-green-100 dark:bg-green-900/30 text-green-600"
        />
        
        <SkillSection 
          title="Languages" 
          skills={languages} 
          category="languages"
          icon={FiGlobe}
          color="bg-purple-100 dark:bg-purple-900/30 text-purple-600"
        />
      </form>

      {/* ATS Suggestions Modal */}
      <Modal
        isOpen={showSuggestionsModal}
        onClose={() => setShowSuggestionsModal(false)}
        title="ATS Keyword Suggestions"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
            >
              <option value="technology">Technology</option>
              <option value="marketing">Marketing</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="sales">Sales</option>
              <option value="education">Education</option>
              <option value="engineering">Engineering</option>
              <option value="design">Design</option>
            </select>
            
            <Button onClick={getSuggestions} icon={<FiRefreshCw />}>
              Refresh
            </Button>
          </div>
          
          {suggestions.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Recommended skills for {selectedIndustry} industry:
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {suggestions.map((skill, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    type="button"
                    onClick={() => addSuggestion(skill)}
                    disabled={technicalSkills.includes(skill)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      technicalSkills.includes(skill)
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{skill}</span>
                      {technicalSkills.includes(skill) ? (
                        <FiCheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <FiPlus className="w-4 h-4" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiSearch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Click refresh to get skill suggestions</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Import Skills Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Skills"
      >
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={importSkillsFromJobDescription}
            className="w-full"
          >
            <FiZap className="w-4 h-4 mr-2" />
            Import from Job Description
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">or</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Paste skills (comma or newline separated)
            </label>
            <textarea
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
              placeholder="React, Node.js, Python&#10;Team Leadership&#10;Problem Solving"
            />
          </div>
          
          <div className="flex gap-2">
            <select className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
              <option value="technical">Technical Skills</option>
              <option value="soft">Soft Skills</option>
              <option value="languages">Languages</option>
            </select>
            
            <Button className="flex-1">
              Import Skills
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default React.memo(Skills);