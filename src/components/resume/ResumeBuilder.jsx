import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiMinimize2,
  FiMaximize2,
  FiSave,
  FiLoader,
  FiLayout,
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
import Progress from '../ui/Progress';
import Tooltip from '../ui/Tooltip';
import Modal from '../ui/Modal';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import toast from 'react-hot-toast';

// ── Section Configuration ─────────────────────────────────────────────────

const SECTION_CONFIG = [
  {
    id: 'personal',
    name: 'Personal Info',
    component: PersonalInfo,
    required: true,
    validate: (data) => Boolean(data?.fullName?.trim() && data?.email?.trim()),
  },
  {
    id: 'education',
    name: 'Education',
    component: Education,
    required: true,
    validate: (data) => Array.isArray(data) && data.length > 0,
  },
  {
    id: 'experience',
    name: 'Experience',
    component: Experience,
    required: true,
    validate: (data) => Array.isArray(data) && data.length > 0,
  },
  {
    id: 'skills',
    name: 'Skills',
    component: Skills,
    required: true,
    validate: (data) =>
      (Array.isArray(data?.technical) && data.technical.length > 0) ||
      (Array.isArray(data?.soft) && data.soft.length > 0),
  },
  {
    id: 'projects',
    name: 'Projects',
    component: Projects,
    required: false,
    validate: (data) => Array.isArray(data) && data.length > 0,
  },
  {
    id: 'certifications',
    name: 'Certifications',
    component: Certifications,
    required: false,
    validate: (data) => Array.isArray(data) && data.length > 0,
  },
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
      return { technical: [], soft: [], languages: [] };
    case 'personal':
    default:
      return {};
  }
};

const getSectionData = (formData, sectionId) =>
  formData?.[sectionId] ?? getEmptySectionData(sectionId);

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
  const [sectionErrors, setSectionErrors] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(fullscreenPreview);

  const shouldReduceMotion = useReducedMotion();
  const mountedRef = useRef(true);
  const saveTimeoutRef = useRef(null);

  // ── React Hook Form ──────────────────────────────────────────────────

  const methods = useForm({
    defaultValues: initialData || {},
    mode: 'onChange',
  });

  const {
    watch,
    setValue,
    getValues,
    formState: { isDirty },
    reset,
  } = methods;

  const formData = watch();
  const currentSectionConfig = SECTION_CONFIG[currentSection];
  const CurrentSectionComponent = currentSectionConfig.component;

  // ── Sync with external data ──────────────────────────────────────────

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // ── Debounced Auto-Save ──────────────────────────────────────────────
  // The debounce lives here so that the async `onChange` callback fires only
  // after ~1500ms of idle typing - not on every keystroke. The parent
  // (`Builder.jsx`) applies its own debounce before writing to Firestore,
  // so this layer protects against parent state churn / reset races.

  const { debouncedCallback: debouncedSave } = useDebouncedCallback(
    useCallback(async () => {
      if (!isDirty || !resumeId) return;

      setIsSaving(true);
      setSaveStatus('saving');

      try {
        const data = getValues();
        await onChange?.(data);
        setSaveStatus('saved');
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('error');
        toast.error('Failed to save changes');
      } finally {
        if (mountedRef.current) setIsSaving(false);
      }
    }, [isDirty, resumeId, onChange, getValues]),
    1500
  );

  // ── Manual Save ──────────────────────────────────────────────────────

  const handleManualSave = useCallback(async () => {
    if (!resumeId) {
      toast.error('Resume not loaded');
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const data = getValues();
      await onChange?.(data);
      setSaveStatus('saved');
      toast.success('Resume saved');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      toast.error('Failed to save');
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }, [resumeId, onChange, getValues]);

  // ── Validate Section ─────────────────────────────────────────────────

  const validateSection = useCallback(
    async (sectionIndex = currentSection) => {
      const section = SECTION_CONFIG[sectionIndex];
      const sectionData = getSectionData(formData, section.id);
      const isValid = section.validate(sectionData);

      setSectionErrors((prev) => ({
        ...prev,
        [section.id]: section.required && !isValid,
      }));

      return isValid;
    },
    [currentSection, formData]
  );

  // ── Navigation ──────────────────────────────────────────────────────

  const handleNext = useCallback(async () => {
    const isValid = await validateSection(currentSection);
    if (!isValid && currentSectionConfig.required) {
      toast.error('Please complete all required fields');
      return;
    }

    if (currentSection < SECTION_CONFIG.length - 1) {
      setCurrentSection((prev) => prev + 1);
      setIsMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentSection, currentSectionConfig.required, validateSection]);

  const handlePrevious = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
      setIsMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentSection]);

  const handleSectionSelect = useCallback(
    async (sectionIndex) => {
      await validateSection(currentSection);
      setCurrentSection(sectionIndex);
      setIsMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [currentSection, validateSection]
  );

  // ── Keyboard Shortcuts ──────────────────────────────────────────────

  useKeyboardShortcut('s', handleManualSave, { ctrl: true });
  useKeyboardShortcut('ArrowRight', handleNext, { alt: true });
  useKeyboardShortcut('ArrowLeft', handlePrevious, { alt: true });

  // ── Auto-Save Effect ────────────────────────────────────────────────

  useEffect(() => {
    debouncedSave();
  }, [formData, debouncedSave]);

  // ── Cleanup ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // saveTimeoutRef holds a numeric timeout ID, not a DOM node. Reading
      // `.current` in cleanup is safe - we explicitly want the latest value.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // ── Derived State ───────────────────────────────────────────────────

  const completedSectionCount = useMemo(
    () =>
      SECTION_CONFIG.filter((section) => section.validate(getSectionData(formData, section.id)))
        .length,
    [formData]
  );

  const completionPercentage = useMemo(
    () => Math.round((completedSectionCount / SECTION_CONFIG.length) * 100),
    [completedSectionCount]
  );

  const hasCurrentSectionError = Boolean(sectionErrors[currentSectionConfig.id]);

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <FormProvider {...methods}>
      <div className="space-y-6 sm:space-y-8">
        {/* Save Status Bar */}
        <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {completionPercentage}%
              </span>
            </div>
            <Progress value={completionPercentage} size="sm" className="w-32" />
          </div>

          <div className="flex items-center gap-3">
            {/* Save Status */}
            <div className="flex items-center gap-2 text-sm">
              {saveStatus === 'saving' && (
                <>
                  <FiLoader className="w-4 h-4 animate-spin text-primary-500" />
                  <span className="text-gray-500">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <FiCheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <FiAlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-500">Save failed</span>
                </>
              )}
              {saveStatus === 'idle' && isDirty && (
                <span className="text-gray-400">Unsaved changes</span>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSave}
              loading={isSaving}
              icon={<FiSave className="w-4 h-4" />}
            >
              Save
            </Button>
          </div>
        </div>

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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resume Sections
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentSectionConfig.name} • Section {currentSection + 1} of{' '}
                  {SECTION_CONFIG.length}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {completedSectionCount}/{SECTION_CONFIG.length} completed
                </span>
                <span className="hidden sm:inline">{completionPercentage}% done</span>
              </div>
            </div>

            {/* Mobile Dropdown */}
            <div className="sm:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium dark:bg-gray-800"
                aria-expanded={isMobileMenuOpen}
              >
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
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleSectionSelect(index)}
                      className={cn(
                        'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:text-sm',
                        isActive
                          ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                      )}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <span>{section.name}</span>
                      {isComplete ? (
                        <FiCheckCircle
                          className={cn(
                            'h-3 w-3 sm:h-4 sm:w-4',
                            isActive ? 'text-white' : 'text-green-500'
                          )}
                        />
                      ) : hasError ? (
                        <FiAlertCircle
                          className={cn(
                            'h-3 w-3 sm:h-4 sm:w-4',
                            isActive ? 'text-white' : 'text-red-500'
                          )}
                        />
                      ) : section.required ? (
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            isActive ? 'bg-white' : 'bg-yellow-500'
                          )}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Form + Preview */}
        <div
          className={cn(
            'grid gap-6 sm:gap-8',
            showPreview && !isFullscreen ? 'lg:grid-cols-2' : 'grid-cols-1'
          )}
        >
          <motion.section
            layout
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: shouldReduceMotion ? 0.12 : 0.2 }}
            className="glass-card p-4 sm:p-6"
          >
            {/* Error Banner */}
            {hasCurrentSectionError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <FiAlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    This section needs attention
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Complete the required fields before moving forward.
                  </p>
                </div>
              </div>
            )}

            {/* Section Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSectionConfig.id}
                initial={shouldReduceMotion ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
                transition={{ duration: shouldReduceMotion ? 0.12 : 0.22 }}
              >
                <CurrentSectionComponent
                  data={getSectionData(formData, currentSectionConfig.id)}
                  onChange={(sectionData) => {
                    setValue(currentSectionConfig.id, sectionData, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  onValidationChange={({ isValid }) => {
                    setSectionErrors((prev) => ({
                      ...prev,
                      [currentSectionConfig.id]: !isValid && currentSectionConfig.required,
                    }));
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSection === 0}
                icon={<FiChevronLeft />}
              >
                Previous
              </Button>
              <span className="hidden text-xs text-gray-500 sm:block">Alt + ← → to navigate</span>
              <Button
                onClick={handleNext}
                disabled={currentSection >= SECTION_CONFIG.length - 1}
                icon={<FiChevronRight />}
                iconPosition="right"
              >
                {currentSection >= SECTION_CONFIG.length - 1 ? 'Last Section' : 'Next'}
              </Button>
            </div>
          </motion.section>

          {showPreview && !isFullscreen && (
            <motion.aside
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={{ duration: shouldReduceMotion ? 0.12 : 0.22 }}
              className="sticky top-20 h-[500px] sm:h-[600px] lg:top-24 lg:h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 shadow-lg backdrop-blur-sm dark:border-gray-700/70 dark:bg-gray-900/90"
            >
              <div className="flex items-center justify-between border-b border-gray-200/70 px-4 py-3 dark:border-gray-700/70">
                <div className="flex items-center gap-2">
                  <FiEye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Live Preview
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {template.charAt(0).toUpperCase() + template.slice(1)} template
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip content="Toggle fullscreen">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFullscreen(true);
                        onFullscreenPreviewChange?.(true);
                      }}
                      className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Fullscreen preview"
                    >
                      <FiMaximize2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Change template">
                    <button
                      type="button"
                      onClick={() => setShowTemplateModal(true)}
                      className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Change template"
                    >
                      <FiLayout className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
              <div className="h-[calc(100%-61px)] overflow-auto">
                <ResumePreview data={formData} template={template} />
              </div>
            </motion.aside>
          )}
        </div>

        {/* Template Selector Modal */}
        <Modal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          title="Choose Template"
          size="lg"
        >
          <TemplateSelector
            selected={template}
            onSelect={(newTemplate) => {
              onTemplateChange?.(newTemplate);
              setShowTemplateModal(false);
              toast.success(`Template changed to ${newTemplate}`);
            }}
          />
        </Modal>

        {/* Fullscreen Preview Overlay */}
        <AnimatePresence>
          {isFullscreen && showPreview && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 p-4 backdrop-blur-sm"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 shadow-lg backdrop-blur-sm dark:border-gray-700/70 dark:bg-gray-900/90">
                <div className="flex items-center justify-between border-b border-gray-200/70 px-4 py-3 dark:border-gray-700/70">
                  <div className="flex items-center gap-2">
                    <FiEye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Fullscreen Preview
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Press Esc to exit</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFullscreen(false);
                      onFullscreenPreviewChange?.(false);
                    }}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Exit fullscreen"
                  >
                    <FiMinimize2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <ResumePreview data={formData} template={template} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormProvider>
  );
};

export default React.memo(ResumeBuilder);
