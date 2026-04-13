import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useResume } from '../../hooks/useResume';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../contexts/AuthContext';
import PersonalInfo from './sections/PersonalInfo';
import Education from './sections/Education';
import Experience from './sections/Experience';
import Skills from './sections/Skills';
import Projects from './sections/Projects';
import Certifications from './sections/Certifications';
import ResumePreview from './ResumePreview';
import TemplateSelector from './TemplateSelector';
import { calculateATSScore } from '../../utils/atsKeywords';
import { 
  FiSave, 
  FiEye, 
  FiChevronRight, 
  FiChevronLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader
} from 'react-icons/fi';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

// Section configuration with validation rules
const sections = [
  { 
    id: 'personal', 
    name: 'Personal Info', 
    component: PersonalInfo,
    required: true,
    validate: (data) => data?.fullName && data?.email
  },
  { 
    id: 'education', 
    name: 'Education', 
    component: Education,
    required: true,
    validate: (data) => data && data.length > 0
  },
  { 
    id: 'experience', 
    name: 'Experience', 
    component: Experience,
    required: true,
    validate: (data) => data && data.length > 0
  },
  { 
    id: 'skills', 
    name: 'Skills', 
    component: Skills,
    required: true,
    validate: (data) => data?.technical && data.technical.length > 0
  },
  { 
    id: 'projects', 
    name: 'Projects', 
    component: Projects,
    required: false,
    validate: () => true
  },
  { 
    id: 'certifications', 
    name: 'Certifications', 
    component: Certifications,
    required: false,
    validate: () => true
  },
];

const ResumeBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resume, saveResume, loading, error } = useResume(id);
  
  // State management
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showPreview, setShowPreview] = useState(() => {
    // Check if there's a saved preference
    const saved = localStorage.getItem('resumeBuilder_showPreview');
    return saved ? JSON.parse(saved) : window.innerWidth >= 1024;
  });
  const [atsScore, setAtsScore] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [sectionErrors, setSectionErrors] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const debouncedFormData = useDebounce(formData, 1500);

  // Load saved data when resume changes
  useEffect(() => {
    if (resume) {
      setFormData(resume.data || {});
      setSelectedTemplate(resume.template || 'modern');
    } else if (id && !loading && !error) {
      // Handle invalid resume ID
      toast.error('Resume not found');
      navigate('/dashboard');
    }
  }, [resume, id, loading, error, navigate]);

  // Save show preview preference
  useEffect(() => {
    localStorage.setItem('resumeBuilder_showPreview', JSON.stringify(showPreview));
  }, [showPreview]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
      // Arrow keys for navigation
      if (e.altKey) {
        if (e.key === 'ArrowRight' && currentSection < sections.length - 1) {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'ArrowLeft' && currentSection > 0) {
          e.preventDefault();
          handlePrevious();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, formData]);

  // Auto-save functionality
  const handleAutoSave = useCallback(async (data = formData) => {
    if (Object.keys(data).length === 0 || !user) return;
    
    setAutoSaveStatus('saving');
    
    try {
      const score = calculateATSScore(data);
      setAtsScore(score);
      
      await saveResume({
        data,
        template: selectedTemplate,
        lastModified: new Date().toISOString(),
        atsScore: score,
        userId: user.uid
      });
      
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      toast.error('Failed to auto-save. Check your connection.');
    }
  }, [formData, selectedTemplate, saveResume, user]);

  // Manual save handler
  const handleManualSave = async () => {
    const validationResult = validateCurrentSection();
    if (!validationResult.isValid) {
      toast.error('Please complete all required fields in this section');
      return;
    }
    
    await handleAutoSave();
    toast.success('Resume saved successfully!');
  };

  // Trigger auto-save when debounced data changes
  useEffect(() => {
    if (Object.keys(debouncedFormData).length > 0) {
      handleAutoSave(debouncedFormData);
    }
  }, [debouncedFormData, handleAutoSave]);

  // Validate current section
  const validateCurrentSection = useCallback(() => {
    const currentSectionData = sections[currentSection];
    const sectionFormData = formData[currentSectionData.id];
    const isValid = currentSectionData.validate(sectionFormData);
    
    setSectionErrors(prev => ({
      ...prev,
      [currentSectionData.id]: !isValid
    }));
    
    return { isValid, sectionId: currentSectionData.id };
  }, [currentSection, formData]);

  // Handle section data changes
  const handleSectionChange = useCallback((sectionData) => {
    setFormData(prev => ({
      ...prev,
      [sections[currentSection].id]: sectionData
    }));
    
    // Clear error for this section if it exists
    if (sectionErrors[sections[currentSection].id]) {
      setSectionErrors(prev => ({
        ...prev,
        [sections[currentSection].id]: false
      }));
    }
  }, [currentSection, sectionErrors]);

  // Navigation handlers with validation
  const handleNext = useCallback(() => {
    const validationResult = validateCurrentSection();
    
    if (!validationResult.isValid && sections[currentSection].required) {
      toast.error('Please complete all required fields before proceeding');
      return;
    }
    
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentSection, validateCurrentSection]);

  const handlePrevious = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentSection]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const completedSections = sections.filter(section => {
      const data = formData[section.id];
      return section.validate(data);
    });
    return (completedSections.length / sections.length) * 100;
  }, [formData]);

  // Check if current section has errors
  const hasCurrentSectionError = sectionErrors[sections[currentSection].id];
  const CurrentSectionComponent = sections[currentSection].component;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading resume builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 sm:pt-20 pb-8 sm:pb-12">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-7xl">
        {/* Header Card */}
        <motion.div 
          className="glass-card mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
                  {id ? 'Edit Resume' : 'Create New Resume'}
                </h1>
                {completionPercentage === 100 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    <FiCheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </span>
                )}
              </div>
              
              {/* Progress and Score Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {/* Progress Bar */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {Math.round(completionPercentage)}% Complete
                  </span>
                </div>

                {/* Section Counter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Section {currentSection + 1}/{sections.length}
                  </span>
                </div>

                {/* ATS Score */}
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium">ATS Score:</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-bold ${
                      atsScore >= 80 ? 'text-green-500' :
                      atsScore >= 60 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {atsScore}%
                    </span>
                    {atsScore < 60 && (
                      <FiAlertCircle className="w-4 h-4 text-yellow-500" title="Add more keywords to improve score" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3">
              {/* Auto-save indicator */}
              {autoSaveStatus === 'saving' && (
                <div className="hidden sm:flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <FiLoader className="w-3 h-3 mr-1 animate-spin" />
                  Saving...
                </div>
              )}
              {autoSaveStatus === 'saved' && (
                <div className="hidden sm:flex items-center text-xs text-green-500">
                  <FiCheckCircle className="w-3 h-3 mr-1" />
                  Saved
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                icon={<FiEye />}
                className="text-xs sm:text-sm"
                size="sm"
              >
                <span className="hidden sm:inline">
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </span>
                <span className="sm:hidden">
                  {showPreview ? 'Hide' : 'Preview'}
                </span>
              </Button>
              
              <Button
                onClick={handleManualSave}
                loading={autoSaveStatus === 'saving'}
                icon={<FiSave />}
                className="text-xs sm:text-sm"
                size="sm"
              >
                <span className="hidden sm:inline">Save Resume</span>
                <span className="sm:hidden">Save</span>
              </Button>
            </div>
          </div>

          {/* Mobile Section Menu Toggle */}
          <div className="sm:hidden mt-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium flex items-center justify-between"
            >
              <span>{sections[currentSection].name}</span>
              <span className="text-gray-500">{isMobileMenuOpen ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* Section Tabs */}
          <div className={`
            ${isMobileMenuOpen ? 'block' : 'hidden'} 
            sm:block mt-4 sm:mt-6
          `}>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {sections.map((section, index) => {
                const isComplete = section.validate(formData[section.id]);
                const hasError = sectionErrors[section.id];
                
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setCurrentSection(index);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                      relative px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm
                      transition-all duration-200 flex items-center gap-1.5 sm:gap-2
                      ${currentSection === index
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }
                    `}
                    aria-current={currentSection === index ? 'step' : undefined}
                  >
                    <span>{section.name}</span>
                    
                    {/* Section Status Indicators */}
                    {isComplete ? (
                      <FiCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    ) : hasError ? (
                      <FiAlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                    ) : section.required ? (
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className={`grid ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6 sm:gap-8`}>
          {/* Form Section */}
          <motion.div 
            layout 
            className="glass-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Section Error Alert */}
            {hasCurrentSectionError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    This section requires your attention
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Please complete all required fields before proceeding
                  </p>
                </div>
              </div>
            )}

            {/* Form Content with Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentSectionComponent
                  data={formData[sections[currentSection].id] || {}}
                  onChange={handleSectionChange}
                  errors={sectionErrors[sections[currentSection].id]}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSection === 0}
                icon={<FiChevronLeft />}
                className="text-xs sm:text-sm"
              >
                Previous
              </Button>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Press Alt + ←/→ to navigate
              </div>
              
              <Button
                onClick={handleNext}
                disabled={currentSection === sections.length - 1}
                icon={<FiChevronRight />}
                iconPosition="right"
                className="text-xs sm:text-sm"
              >
                {currentSection === sections.length - 1 ? 'Complete' : 'Next'}
              </Button>
            </div>
          </motion.div>

          {/* Preview Section */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="glass-card sticky top-20 lg:top-24 h-[500px] sm:h-[600px] lg:h-[calc(100vh-8rem)] overflow-hidden"
              >
                <div className="h-full overflow-auto custom-scrollbar">
                  <ResumePreview
                    data={formData}
                    template={selectedTemplate}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Template Selector */}
        <motion.div 
          className="mt-6 sm:mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TemplateSelector
            selected={selectedTemplate}
            onSelect={setSelectedTemplate}
          />
        </motion.div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
      `}</style>
    </div>
  );
};

export default React.memo(ResumeBuilder);