import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  FiAlertCircle, FiCheckCircle, FiChevronLeft, FiChevronRight,
  FiEye, FiMinimize2, FiX,
} from 'react-icons/fi';
import PersonalInfo from './sections/PersonalInfo';
import Education from './sections/Education';
import Experience from './sections/Experience';
import Skills from './sections/Skills';
import Projects from './sections/Projects';
import Certifications from './sections/Certifications';
import ResumePreview from './ResumePreview';
import TemplateSelector from './TemplateSelector';
import Button from '../ui/Button';

// ── Section Configuration ─────────────────────────────────────────────────

const SECTION_CONFIG = [
  { id: 'personal', name: 'Personal Info', component: PersonalInfo, required: true,
    validate: (data) => Boolean(data?.fullName?.trim() && data?.email?.trim()) },
  { id: 'education', name: 'Education', component: Education, required: true,
    validate: (data) => Array.isArray(data) && data.length > 0 },
  { id: 'experience', name: 'Experience', component: Experience, required: true,
    validate: (data) => Array.isArray(data) && data.length > 0 },
  { id: 'skills', name: 'Skills', component: Skills, required: true,
    validate: (data) => (Array.isArray(data?.technical) && data.technical.length > 0) || (Array.isArray(data?.soft) && data.soft.length > 0) },
  { id: 'projects', name: 'Projects', component: Projects, required: false,
    validate: (data) => Array.isArray(data) && data.length > 0 },
  { id: 'certifications', name: 'Certifications', component: Certifications, required: false,
    validate: (data) => Array.isArray(data) && data.length > 0 },
];

// ── Utility Functions ────────────────────────────────────────────────────

const getEmptySectionData = (sectionId) => {
  switch (sectionId) {
    case 'education':
    case 'experience':
    case 'projects':
    case 'certifications':
      return [];
    case 'skills':
      return { technical: [], soft: [], languages: [] }; // FIXED: Removed `tools`
    case 'personal':
    default:
      return {};
  }
};

const getSectionData = (formData, sectionId) => formData?.[sectionId] ?? getEmptySectionData(sectionId);

// FIXED: More robust typing target check
const isTypingTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  // Check for common rich text editors
  if (target.closest('[contenteditable="true"]')) return true;
  if (target.getAttribute('role') === 'textbox') return true;
  return false;
};

const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Main Component ─────────────────────────────────────────────────────────

const ResumeBuilder = ({
  resumeId,
  initialData = {},
  template = 'modern',
  showPreview = true,
  fullscreenPreview = false,
  onChange,
  onTemplateChange,
  onFullscreenPreviewChange,
  showTemplateSelector = false,
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [draftData, setDraftData] = useState(() => initialData || {});
  const [sectionErrors, setSectionErrors] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  // ── Sync with external data ──────────────────────────────────────────

  useEffect(() => {
    setDraftData(initialData || {});
  }, [initialData, resumeId]);

  useEffect(() => {
    setCurrentSection(0);
    setSectionErrors({});
    setIsMobileMenuOpen(false);
  }, [resumeId]);

  // ── Derived State ────────────────────────────────────────────────────

  const formData = draftData || {};
  const currentSectionConfig = SECTION_CONFIG[currentSection];
  const CurrentSectionComponent = currentSectionConfig.component;
  const currentSectionData = useMemo(
    () => getSectionData(formData, currentSectionConfig.id),
    [formData, currentSectionConfig.id]
  );

  const completedSectionCount = useMemo(
    () => SECTION_CONFIG.filter(section => section.validate(getSectionData(formData, section.id))).length,
    [formData]
  );

  const completionPercentage = useMemo(
    () => Math.round((completedSectionCount / SECTION_CONFIG.length) * 100),
    [completedSectionCount]
  );

  const hasCurrentSectionError = Boolean(sectionErrors[currentSectionConfig.id]);
  const shouldRenderPreview = Boolean(showPreview || fullscreenPreview);

  // ── Validation ────────────────────────────────────────────────────────

  const validateSection = useCallback((sectionIndex = currentSection) => {
    const section = SECTION_CONFIG[sectionIndex];
    const isValid = section.validate(getSectionData(formData, section.id));
    const showError = section.required && !isValid;

    setSectionErrors(prev => {
      if (prev[section.id] === showError) return prev;
      return { ...prev, [section.id]: showError };
    });

    return isValid;
  }, [currentSection, formData]);

  // ── Section Change Handler ───────────────────────────────────────────

  const handleSectionChange = useCallback((sectionData) => {
    const sectionId = currentSectionConfig.id;
    const nextData = { ...formData, [sectionId]: sectionData };

    setDraftData(nextData);
    onChange?.(nextData);

    // Auto-clear error if section becomes valid
    if (sectionErrors[sectionId] && currentSectionConfig.validate(sectionData)) {
      setSectionErrors(prev => ({ ...prev, [sectionId]: false }));
    }
  }, [currentSectionConfig, formData, onChange, sectionErrors]);

  // ── Navigation ──────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    const isValid = validateSection(currentSection);
    if (!isValid && currentSectionConfig.required) return;

    if (currentSection < SECTION_CONFIG.length - 1) {
      setCurrentSection(prev => prev + 1);
      setIsMobileMenuOpen(false);
      scrollToTop();
    }
  }, [currentSection, currentSectionConfig.required, validateSection]);

  const handlePrevious = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      setIsMobileMenuOpen(false);
      scrollToTop();
    }
  }, [currentSection]);

  const handleSectionSelect = useCallback((sectionIndex) => {
    validateSection(currentSection);
    setCurrentSection(sectionIndex);
    setIsMobileMenuOpen(false);
    scrollToTop();
  }, [currentSection, validateSection]);

  // ── Keyboard Navigation ──────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (event) => {
      // FIXED: Skip if typing target or if modifiers other than Alt
      if (isTypingTarget(event.target) || !event.altKey || event.ctrlKey || event.metaKey) return;

      if (event.key === 'ArrowRight' && currentSection < SECTION_CONFIG.length - 1) {
        event.preventDefault();
        handleNext();
      } else if (event.key === 'ArrowLeft' && currentSection > 0) {
        event.preventDefault();
        handlePrevious();
      }
    };

    // FIXED: Also handle Escape for fullscreen preview
    const handleEscape = (event) => {
      if (event.key === 'Escape' && fullscreenPreview && typeof onFullscreenPreviewChange === 'function') {
        onFullscreenPreviewChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [currentSection, handleNext, handlePrevious, fullscreenPreview, onFullscreenPreviewChange]);

  // FIXED: Added Escape handler for fullscreen separately
  useEffect(() => {
    if (!fullscreenPreview) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && typeof onFullscreenPreviewChange === 'function') {
        onFullscreenPreviewChange(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [fullscreenPreview, onFullscreenPreviewChange]);

  // ── Preview Panel Renderer ──────────────────────────────────────────

  const renderPreviewPanel = useCallback((isFullscreen = false) => (
    <motion.aside
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      transition={{ duration: shouldReduceMotion ? 0.12 : 0.22 }}
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 shadow-lg backdrop-blur-sm dark:border-gray-700/70 dark:bg-gray-900/90',
        isFullscreen ? 'h-full' : 'sticky top-20 h-[500px] sm:h-[600px] lg:top-24 lg:h-[calc(100vh-8rem)]'
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200/70 px-4 py-3 dark:border-gray-700/70">
        <div className="flex items-center gap-2">
          <FiEye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Live Preview</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{template.charAt(0).toUpperCase() + template.slice(1)} template</p>
          </div>
        </div>
        {isFullscreen && (
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-gray-500 sm:inline">Press Esc to exit</span>
            {typeof onFullscreenPreviewChange === 'function' && (
              <button type="button" onClick={() => onFullscreenPreviewChange(false)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Exit fullscreen preview">
                <FiMinimize2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="h-[calc(100%-61px)] overflow-auto">
        <ResumePreview data={formData} template={template} />
      </div>
    </motion.aside>
  ), [formData, template, shouldReduceMotion, onFullscreenPreviewChange]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section Navigation */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.12 : 0.24 }}
        className="glass-card p-4 sm:p-5"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resume Sections</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentSectionConfig.name} • Section {currentSection + 1} of {SECTION_CONFIG.length}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span>{completedSectionCount}/{SECTION_CONFIG.length} completed</span>
              <span className="hidden sm:inline">{completionPercentage}% done</span>
            </div>
          </div>

          {/* Mobile Dropdown */}
          <div className="sm:hidden">
            <button type="button" onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="flex w-full items-center justify-between rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium dark:bg-gray-800"
              aria-expanded={isMobileMenuOpen}>
              <span>{currentSectionConfig.name}</span>
              <span>{isMobileMenuOpen ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* Section Tabs */}
          <div className={cn(isMobileMenuOpen ? 'block' : 'hidden', 'sm:block')}>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {SECTION_CONFIG.map((section, index) => {
                const isActive = currentSection === index;
                const isComplete = section.validate(getSectionData(formData, section.id));
                const hasError = Boolean(sectionErrors[section.id]);

                return (
                  <button key={section.id} type="button" onClick={() => handleSectionSelect(index)}
                    className={cn(
                      'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:text-sm',
                      isActive ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                    )}
                    aria-current={isActive ? 'step' : undefined}>
                    <span>{section.name}</span>
                    {isComplete ? (
                      <FiCheckCircle className={cn('h-3 w-3 sm:h-4 sm:w-4', isActive ? 'text-white' : 'text-green-500')} />
                    ) : hasError ? (
                      <FiAlertCircle className={cn('h-3 w-3 sm:h-4 sm:w-4', isActive ? 'text-white' : 'text-red-500')} />
                    ) : section.required ? (
                      <span className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-white' : 'bg-yellow-500')} />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Form + Preview */}
      <div className={cn('grid gap-6 sm:gap-8', shouldRenderPreview && !fullscreenPreview ? 'lg:grid-cols-2' : 'grid-cols-1')}>
        <motion.section layout initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0.12 : 0.2 }} className="glass-card p-4 sm:p-6">
          
          {/* Error Banner */}
          {hasCurrentSectionError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <FiAlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">This section needs attention</p>
                <p className="text-xs text-red-600 dark:text-red-400">Complete the required fields before moving forward.</p>
              </div>
            </div>
          )}

          {/* Section Content */}
          <AnimatePresence mode="wait">
            <motion.div key={currentSectionConfig.id}
              initial={shouldReduceMotion ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
              transition={{ duration: shouldReduceMotion ? 0.12 : 0.22 }}>
              <CurrentSectionComponent data={currentSectionData} onChange={handleSectionChange} />
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
            <Button variant="outline" onClick={handlePrevious} disabled={currentSection === 0} icon={<FiChevronLeft />}>Previous</Button>
            <span className="hidden text-xs text-gray-500 sm:block">Alt + ← → to navigate</span>
            <Button onClick={handleNext} disabled={currentSection >= SECTION_CONFIG.length - 1}
              icon={<FiChevronRight />} iconPosition="right">
              {currentSection >= SECTION_CONFIG.length - 1 ? 'Last Section' : 'Next'}
            </Button>
          </div>
        </motion.section>

        {shouldRenderPreview && !fullscreenPreview && renderPreviewPanel(false)}
      </div>

      {/* Template Selector */}
      {showTemplateSelector && typeof onTemplateChange === 'function' && (
        <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.12 : 0.24 }}>
          <TemplateSelector selected={template} onSelect={onTemplateChange} />
        </motion.div>
      )}

      {/* Fullscreen Preview Overlay */}
      <AnimatePresence>
        {shouldRenderPreview && fullscreenPreview && (
          <motion.div initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 p-4 backdrop-blur-sm">
            {renderPreviewPanel(true)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(ResumeBuilder);
