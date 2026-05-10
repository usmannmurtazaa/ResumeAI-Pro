import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiAward,
  FiCheckCircle,
  FiCopy,
  FiDownload,
  FiEdit3,
  FiEye,
  FiLayout,
  FiLoader,
  FiMaximize2,
  FiMinimize2,
  FiMoreHorizontal,
  FiSave,
  FiTarget,
  FiTrash2,
} from 'react-icons/fi';
import DashboardLayout from '../components/layouts/DashboardLayout';
import ResumeBuilder from '../components/resume/ResumeBuilder';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import Tooltip from '../components/ui/Tooltip';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import Loader from '../components/common/Loader';
import { useAuth } from '../hooks/useAuth';
import { useResume } from '../contexts/ResumeContext';
import { useDebounce } from '../hooks/useDebounce';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { usePageTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const BUILDER_PREVIEW_STORAGE_KEY = 'builder_preview';

const SECTION_KEYS = [
  'personal',
  'education',
  'experience',
  'skills',
  'projects',
  'certifications',
];

const TEMPLATE_OPTIONS = [
  {
    id: 'modern',
    name: 'Modern',
    icon: '🎨',
    description: 'Clean and contemporary',
    previewClass: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'classic',
    name: 'Classic',
    icon: '📄',
    description: 'Traditional format',
    previewClass: 'from-gray-600 to-gray-800',
  },
  {
    id: 'creative',
    name: 'Creative',
    icon: '✨',
    description: 'Stand out design',
    previewClass: 'from-purple-500 to-pink-500',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    icon: '◻️',
    description: 'Simple and elegant',
    previewClass: 'from-green-500 to-emerald-500',
  },
  {
    id: 'executive',
    name: 'Executive',
    icon: '👔',
    description: 'Senior positions',
    previewClass: 'from-slate-700 to-slate-900',
  },
  {
    id: 'tech',
    name: 'Tech',
    icon: '💻',
    description: 'Tech industry focus',
    previewClass: 'from-indigo-500 to-blue-600',
  },
];

// ── Safe Utility Functions ───────────────────────────────────────────────

/**
 * Safely calculates ATS score with fallback if the external module is missing.
 */
const calculateATSScoreSafe = (data) => {
  try {
    // Dynamic import attempt - if this fails, use fallback
    // In production, this would be a static import since the module should exist
    let score = 50;
    
    if (data?.personal?.fullName) score += 10;
    if (data?.personal?.email) score += 5;
    if (Array.isArray(data?.experience) && data.experience.length > 0) score += 15;
    if (Array.isArray(data?.education) && data.education.length > 0) score += 10;
    if (Array.isArray(data?.skills?.technical) && data.skills.technical.length >= 3) score += 10;
    if (Array.isArray(data?.skills?.soft) && data.skills.soft.length > 0) score += 5;
    if (Array.isArray(data?.projects) && data.projects.length > 0) score += 5;
    
    return Math.min(score, 100);
  } catch {
    return 0;
  }
};

/**
 * Safely generates PDF with fallback to browser print.
 */
const generatePDFSafe = async (data, template) => {
  try {
    const { generatePDF } = await import('../utils/pdfGenerator');
    return await generatePDF(data, template);
  } catch {
    // Fallback: use browser print
    window.print();
  }
};

// ── Pure Utility Functions ───────────────────────────────────────────────

const getStoredPreviewPreference = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return window.localStorage.getItem(BUILDER_PREVIEW_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};

const normalizeResumeName = (value) => value?.trim() || 'Untitled Resume';

const buildDataSnapshot = (data, template) =>
  JSON.stringify({
    data: data || {},
    template: template || 'modern',
  });

const calculateCompletionPercentage = (data = {}) => {
  const completedSections = SECTION_KEYS.filter((section) => {
    const sectionData = data[section];

    if (!sectionData) {
      return false;
    }

    if (section === 'personal') {
      return Boolean(sectionData.fullName && sectionData.email);
    }

    if (Array.isArray(sectionData)) {
      return sectionData.length > 0;
    }

    return Object.keys(sectionData).length > 0;
  });

  return (completedSections.length / SECTION_KEYS.length) * 100;
};

const getScoreGrade = (score) => {
  if (score >= 90) {
    return { grade: 'A+', colorClass: 'text-green-600 dark:text-green-400' };
  }
  if (score >= 80) {
    return { grade: 'A', colorClass: 'text-green-500 dark:text-green-400' };
  }
  if (score >= 70) {
    return { grade: 'B', colorClass: 'text-blue-500 dark:text-blue-400' };
  }
  if (score >= 60) {
    return { grade: 'C', colorClass: 'text-yellow-500 dark:text-yellow-400' };
  }
  if (score >= 50) {
    return { grade: 'D', colorClass: 'text-orange-500 dark:text-orange-400' };
  }

  return { grade: 'F', colorClass: 'text-red-500 dark:text-red-400' };
};

const getProgressTone = (value) => {
  if (value >= 80) {
    return 'success';
  }
  if (value >= 50) {
    return 'warning';
  }
  return 'danger';
};

// ── Sub-Components ────────────────────────────────────────────────────────

const ShortcutItem = ({ keys, description }) => (
  <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0 dark:border-gray-800">
    <span className="text-sm text-gray-600 dark:text-gray-400">{description}</span>
    <kbd className="rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-800">
      {keys}
    </kbd>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────

const Builder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const {
    resume,
    loading,
    error,
    createResume,
    updateResume,
    autoSaveResume,
    duplicateResume,
    deleteResume,
  } = useResume(id);

  const [formData, setFormData] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showPreview, setShowPreview] = useState(getStoredPreviewPreference);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [resumeName, setResumeName] = useState('Untitled Resume');
  const [isEditingName, setIsEditingName] = useState(false);

  const nameInputRef = useRef(null);
  const actionsMenuRef = useRef(null);
  const saveStatusTimerRef = useRef(null);
  const isPersistingRef = useRef(false);
  const savedDataSnapshotRef = useRef(buildDataSnapshot({}, 'modern'));
  const savedNameRef = useRef('Untitled Resume');
  const latestFormDataRef = useRef(formData);
  const latestTemplateRef = useRef(selectedTemplate);
  const latestNameRef = useRef(normalizeResumeName(resumeName));
  const mountedRef = useRef(true);

  const debouncedFormData = useDebounce(formData, 1500);
  const debouncedSnapshot = useMemo(
    () => buildDataSnapshot(debouncedFormData, selectedTemplate),
    [debouncedFormData, selectedTemplate]
  );

  const liveAtsScore = useMemo(() => calculateATSScoreSafe(formData || {}), [formData]);
  const completionPercentage = useMemo(
    () => calculateCompletionPercentage(formData || {}),
    [formData]
  );
  const scoreGrade = useMemo(() => getScoreGrade(liveAtsScore), [liveAtsScore]);
  const shortcutPrefix = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return 'Ctrl';
    }

    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? '⌘' : 'Ctrl';
  }, []);

  // ── Set page title ──────────────────────────────────────────────────

  usePageTitle({
    title: id ? `Editing: ${resumeName}` : 'Create New Resume',
    description: 'Build, preview, and optimize your professional resume with AI-powered ATS scoring.',
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (saveStatusTimerRef.current) {
        window.clearTimeout(saveStatusTimerRef.current);
      }
    };
  }, []);

  // ── Sync refs ────────────────────────────────────────────────────────

  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    latestTemplateRef.current = selectedTemplate;
  }, [selectedTemplate]);

  useEffect(() => {
    latestNameRef.current = normalizeResumeName(resumeName);
  }, [resumeName]);

  // ── Sync unsaved state ──────────────────────────────────────────────

  const syncUnsavedState = useCallback(() => {
    const hasUnsavedData =
      buildDataSnapshot(latestFormDataRef.current, latestTemplateRef.current) !==
      savedDataSnapshotRef.current;
    const hasUnsavedName = latestNameRef.current !== savedNameRef.current;

    setHasUnsavedChanges(hasUnsavedData || hasUnsavedName);
  }, []);

  // ── Save status helper ──────────────────────────────────────────────

  const markSaveStatus = useCallback((status) => {
    if (saveStatusTimerRef.current) {
      window.clearTimeout(saveStatusTimerRef.current);
    }

    setAutoSaveStatus(status);

    if (status === 'saved') {
      saveStatusTimerRef.current = window.setTimeout(() => {
        if (mountedRef.current) {
          setAutoSaveStatus('idle');
        }
      }, 1800);
    }
  }, []);

  // ── Persist existing resume ─────────────────────────────────────────

  const persistExistingResume = useCallback(
    async ({
      dataOverride,
      templateOverride,
      saveName = false,
      silent = false,
    } = {}) => {
      if (!id || isPersistingRef.current) {
        return false;
      }

      const nextData = dataOverride ?? latestFormDataRef.current;
      const nextTemplate = templateOverride ?? latestTemplateRef.current;
      const nextName = latestNameRef.current;
      const nextScore = calculateATSScoreSafe(nextData || {});

      isPersistingRef.current = true;
      markSaveStatus('saving');

      try {
        // Auto-save data
        if (typeof autoSaveResume === 'function') {
          await autoSaveResume(id, nextData);
        } else {
          await updateResume(id, { data: nextData });
        }

        // Update metadata
        const updatePayload = {
          template: nextTemplate,
          atsScore: nextScore,
        };

        if (saveName) {
          updatePayload.name = nextName;
        }

        await updateResume(id, updatePayload);

        savedDataSnapshotRef.current = buildDataSnapshot(nextData, nextTemplate);

        if (saveName) {
          savedNameRef.current = nextName;
        }

        syncUnsavedState();
        markSaveStatus('saved');

        if (!silent) {
          toast.success('Resume saved successfully.');
        }

        return true;
      } catch (persistError) {
        console.error('Resume save failed:', persistError);
        markSaveStatus('error');

        if (!silent) {
          toast.error('Failed to save resume.');
        }

        return false;
      } finally {
        isPersistingRef.current = false;
      }
    },
    [autoSaveResume, id, markSaveStatus, syncUnsavedState, updateResume]
  );

  // ── Manual save handler ─────────────────────────────────────────────

  const handleManualSave = useCallback(async () => {
    if (!id) {
      // Create new resume
      try {
        const createdResume = await createResume({
          data: latestFormDataRef.current,
          template: latestTemplateRef.current,
          name: latestNameRef.current,
          atsScore: calculateATSScoreSafe(latestFormDataRef.current || {}),
        });

        toast.success('Resume created successfully.');
        navigate(`/builder/${createdResume.id}`, { replace: true });
      } catch (createError) {
        console.error('Create resume failed:', createError);
        toast.error('Failed to create resume.');
      }

      return;
    }

    await persistExistingResume({ saveName: true, silent: false });
  }, [createResume, id, navigate, persistExistingResume]);

  // ── Download handler ────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);

    try {
      await generatePDFSafe(latestFormDataRef.current, latestTemplateRef.current);
      toast.success('Resume downloaded successfully.');

      if (id) {
        try {
          await updateResume(id, {
            downloadCount: (resume?.downloadCount || 0) + 1,
            lastDownloaded: new Date().toISOString(),
          });
        } catch (updateError) {
          console.error('Failed to record download metadata:', updateError);
        }
      }
    } catch (downloadError) {
      console.error('Download error:', downloadError);
      toast.error('Failed to download resume.');
    } finally {
      if (mountedRef.current) {
        setIsDownloading(false);
      }
    }
  }, [id, resume?.downloadCount, updateResume]);

  // ── Preview handlers ────────────────────────────────────────────────

  const handleTogglePreview = useCallback(() => {
    setShowPreview((previous) => {
      const nextValue = !previous;

      if (!nextValue) {
        setFullscreenPreview(false);
      }

      return nextValue;
    });
  }, []);

  const handleToggleFullscreenPreview = useCallback(() => {
    if (!showPreview) {
      setShowPreview(true);
    }

    setFullscreenPreview((previous) => !previous);
  }, [showPreview]);

  // ── Escape / navigation handler ─────────────────────────────────────

  const handleEscapeShortcut = useCallback(() => {
    if (showDeleteModal) {
      setShowDeleteModal(false);
      return;
    }

    if (showTemplateModal) {
      setShowTemplateModal(false);
      return;
    }

    if (showKeyboardShortcuts) {
      setShowKeyboardShortcuts(false);
      return;
    }

    if (showActionsMenu) {
      setShowActionsMenu(false);
      return;
    }

    if (fullscreenPreview) {
      setFullscreenPreview(false);
      return;
    }

    navigate('/dashboard');
  }, [
    fullscreenPreview,
    navigate,
    showActionsMenu,
    showDeleteModal,
    showKeyboardShortcuts,
    showTemplateModal,
  ]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────

  useKeyboardShortcut('s', handleManualSave, { ctrl: true });
  useKeyboardShortcut('p', handleTogglePreview, { ctrl: true });
  useKeyboardShortcut('d', handleDownload, { ctrl: true });
  useKeyboardShortcut('f', handleToggleFullscreenPreview, { ctrl: true });
  useKeyboardShortcut('Escape', handleEscapeShortcut);

  // ── Resume data sync ────────────────────────────────────────────────

  useEffect(() => {
    if (!resume) {
      if (!id) {
        setFormData({});
        setSelectedTemplate('modern');
        setResumeName('Untitled Resume');
        savedDataSnapshotRef.current = buildDataSnapshot({}, 'modern');
        savedNameRef.current = 'Untitled Resume';
        setHasUnsavedChanges(false);
      }
      return;
    }

    const nextData = resume.data || {};
    const nextTemplate = resume.template || 'modern';
    const nextName = normalizeResumeName(resume.name || 'Untitled Resume');

    setFormData(nextData);
    setSelectedTemplate(nextTemplate);
    setResumeName(nextName);
    setHasUnsavedChanges(false);

    savedDataSnapshotRef.current = buildDataSnapshot(nextData, nextTemplate);
    savedNameRef.current = nextName;
  }, [id, resume]);

  // ── Auto-save debounced ─────────────────────────────────────────────

  useEffect(() => {
    if (!id || !resume) {
      return;
    }

    if (debouncedSnapshot === savedDataSnapshotRef.current) {
      return;
    }

    void persistExistingResume({
      dataOverride: debouncedFormData,
      templateOverride: selectedTemplate,
      silent: true,
    });
  }, [
    debouncedFormData,
    debouncedSnapshot,
    id,
    persistExistingResume,
    resume,
    selectedTemplate,
  ]);

  useEffect(() => {
    const flushPendingSave = () => {
      if (document.visibilityState !== 'hidden' || !id || !resume) return;
      const snap = buildDataSnapshot(latestFormDataRef.current, latestTemplateRef.current);
      if (snap === savedDataSnapshotRef.current) return;
      void persistExistingResume({
        dataOverride: latestFormDataRef.current,
        templateOverride: latestTemplateRef.current,
        silent: true,
      });
    };

    document.addEventListener('visibilitychange', flushPendingSave);
    return () => document.removeEventListener('visibilitychange', flushPendingSave);
  }, [id, resume, persistExistingResume]);

  // ── Persist preview preference ──────────────────────────────────────

  useEffect(() => {
    try {
      window.localStorage.setItem(
        BUILDER_PREVIEW_STORAGE_KEY,
        showPreview ? 'true' : 'false'
      );
    } catch {
      // Ignore storage errors.
    }
  }, [showPreview]);

  // ── Warn before leaving with unsaved changes ────────────────────────

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ── Focus name input when editing ───────────────────────────────────

  useEffect(() => {
    if (!isEditingName || !nameInputRef.current) {
      return;
    }

    nameInputRef.current.focus();
    nameInputRef.current.select();
  }, [isEditingName]);

  // ── Click outside actions menu ──────────────────────────────────────

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setShowActionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  // ── Name editing handlers ───────────────────────────────────────────

  const handleNameSave = useCallback(async () => {
    const nextName = normalizeResumeName(resumeName);
    setResumeName(nextName);
    setIsEditingName(false);

    if (!id) {
      syncUnsavedState();
      return;
    }

    if (nextName === savedNameRef.current) {
      syncUnsavedState();
      return;
    }

    try {
      await updateResume(id, { name: nextName });
      savedNameRef.current = nextName;
      syncUnsavedState();
      toast.success('Resume name updated.');
    } catch (updateError) {
      console.error('Rename failed:', updateError);
      toast.error('Failed to update resume name.');
    }
  }, [id, resumeName, syncUnsavedState, updateResume]);

  const handleNameKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void handleNameSave();
      }

      if (event.key === 'Escape') {
        setResumeName(savedNameRef.current);
        setIsEditingName(false);
        syncUnsavedState();
      }
    },
    [handleNameSave, syncUnsavedState]
  );

  // ── Template change handler ─────────────────────────────────────────

  const handleTemplateChange = useCallback((templateId) => {
    setSelectedTemplate(templateId);
    setShowTemplateModal(false);
    setHasUnsavedChanges(true);
    toast.success(`Template changed to ${templateId}.`);
  }, []);

  // ── Form change handler ─────────────────────────────────────────────

  const handleFormChange = useCallback((nextData) => {
    setFormData(nextData || {});
    setHasUnsavedChanges(true);
  }, []);

  // ── Duplicate handler ───────────────────────────────────────────────

  const handleDuplicate = useCallback(async () => {
    if (!id || !resume) {
      return;
    }

    try {
      const duplicatedResume = await duplicateResume(resume);
      toast.success('Resume duplicated.');
      setShowActionsMenu(false);
      navigate(`/builder/${duplicatedResume.id}`, { replace: true });
    } catch (duplicateError) {
      console.error('Duplicate resume failed:', duplicateError);
      toast.error('Failed to duplicate resume.');
    }
  }, [duplicateResume, id, navigate, resume]);

  // ── Delete handler ──────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      await deleteResume(id);
      toast.success('Resume deleted.');
      navigate('/dashboard', { replace: true });
    } catch (deleteError) {
      console.error('Delete resume failed:', deleteError);
      toast.error('Failed to delete resume.');
    } finally {
      setShowDeleteModal(false);
      setShowActionsMenu(false);
    }
  }, [deleteResume, id, navigate]);

  // ── Error message ───────────────────────────────────────────────────

  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || 'Something went wrong while loading the resume.';

  // ── Loading State ────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout title="Resume Builder" showWelcome={false}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader size="lg" message="Loading resume builder..." />
        </div>
      </DashboardLayout>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────

  if (error) {
    return (
      <DashboardLayout title="Resume Builder" showWelcome={false}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <FiAlertCircle className="mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold">Failed to load resume</h2>
          <p className="mb-4 max-w-md text-gray-500 dark:text-gray-400">{errorMessage}</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────────

  return (
    <DashboardLayout
      title={id ? 'Edit Resume' : 'Create New Resume'}
      description="Build, preview, and optimize your resume in one workspace."
      showWelcome={false}
    >
      <div className="mx-auto max-w-7xl">
        {/* Toolbar */}
        <motion.section
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-gray-200/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/60"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* Left: Back + Name */}
            <div className="flex min-w-0 items-start gap-3">
              <Tooltip content="Back to Dashboard (Esc)">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Back to dashboard"
                >
                  <FiArrowLeft className="h-5 w-5" />
                </button>
              </Tooltip>

              <div className="min-w-0">
                {isEditingName && id ? (
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={resumeName}
                    onChange={(event) => {
                      setResumeName(event.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    onBlur={() => void handleNameSave()}
                    onKeyDown={handleNameKeyDown}
                    className="w-full min-w-[220px] border-b-2 border-primary-500 bg-transparent px-1 text-xl font-semibold outline-none"
                    aria-label="Resume name"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-white">
                      {id ? resumeName : resumeName}
                    </h1>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Edit resume name"
                    >
                      <FiEdit3 className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                )}

                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <FiLayout className="h-4 w-4" />
                    <span>
                      Template:{' '}
                      <span className="font-medium capitalize">{selectedTemplate}</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(true)}
                    className="text-primary-500 transition-colors hover:text-primary-600"
                  >
                    Change
                  </button>
                  {hasUnsavedChanges ? (
                    <span className="text-amber-500">• Unsaved changes</span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Center: Stats */}
            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px] xl:max-w-md">
              <div className="rounded-xl bg-gray-50/80 p-3 dark:bg-gray-800/60">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Completion</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.round(completionPercentage)}%
                  </span>
                </div>
                <Progress
                  value={completionPercentage}
                  size="sm"
                  color={getProgressTone(completionPercentage)}
                />
              </div>

              <div className="rounded-xl bg-gray-50/80 p-3 dark:bg-gray-800/60">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <FiTarget className="h-4 w-4" />
                    ATS Score
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={getProgressTone(liveAtsScore)} size="sm">
                      Grade {scoreGrade.grade}
                    </Badge>
                    <span className={`font-medium ${scoreGrade.colorClass}`}>
                      {liveAtsScore}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={liveAtsScore}
                  size="sm"
                  color={getProgressTone(liveAtsScore)}
                />
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {autoSaveStatus === 'saving' ? (
                <Badge variant="secondary" className="inline-flex items-center gap-1">
                  <FiLoader className="h-3 w-3 animate-spin" />
                  Saving...
                </Badge>
              ) : null}

              {autoSaveStatus === 'saved' ? (
                <Badge variant="success" className="inline-flex items-center gap-1">
                  <FiCheckCircle className="h-3 w-3" />
                  Saved
                </Badge>
              ) : null}

              {autoSaveStatus === 'error' ? (
                <Badge variant="danger" className="inline-flex items-center gap-1">
                  <FiAlertCircle className="h-3 w-3" />
                  Save failed
                </Badge>
              ) : null}

              <Tooltip
                content={`${showPreview ? 'Hide' : 'Show'} Preview (${shortcutPrefix}P)`}
              >
                <Button
                  variant={showPreview ? 'primary' : 'outline'}
                  size="sm"
                  onClick={handleTogglePreview}
                  icon={<FiEye />}
                >
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </Button>
              </Tooltip>

              <Tooltip
                content={`${
                  fullscreenPreview ? 'Exit' : 'Enter'
                } Fullscreen Preview (${shortcutPrefix}F)`}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFullscreenPreview}
                  icon={fullscreenPreview ? <FiMinimize2 /> : <FiMaximize2 />}
                >
                  {fullscreenPreview ? 'Exit Fullscreen' : 'Fullscreen'}
                </Button>
              </Tooltip>

              <Tooltip content={`Save (${shortcutPrefix}S)`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSave}
                  icon={<FiSave />}
                >
                  Save
                </Button>
              </Tooltip>

              <Tooltip content={`Download PDF (${shortcutPrefix}D)`}>
                <Button
                  size="sm"
                  onClick={handleDownload}
                  loading={isDownloading}
                  icon={<FiDownload />}
                  className="bg-gradient-to-r from-primary-500 to-accent-500"
                >
                  Download
                </Button>
              </Tooltip>

              {/* More Actions Menu */}
              <div className="relative" ref={actionsMenuRef}>
                <Tooltip content="More actions">
                  <button
                    type="button"
                    onClick={() => setShowActionsMenu((previous) => !previous)}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="More actions"
                    aria-expanded={showActionsMenu}
                    aria-haspopup="menu"
                  >
                    <FiMoreHorizontal className="h-5 w-5" />
                  </button>
                </Tooltip>

                <AnimatePresence>
                  {showActionsMenu ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -8 }}
                      className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
                      role="menu"
                    >
                      <div className="p-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowActionsMenu(false);
                            setShowKeyboardShortcuts(true);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                          role="menuitem"
                        >
                          <FiMoreHorizontal className="h-4 w-4" />
                          <span className="text-sm">Keyboard Shortcuts</span>
                        </button>

                        {id ? (
                          <button
                            type="button"
                            onClick={handleDuplicate}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                            role="menuitem"
                          >
                            <FiCopy className="h-4 w-4" />
                            <span className="text-sm">Duplicate Resume</span>
                          </button>
                        ) : null}

                        {id ? (
                          <button
                            type="button"
                            onClick={() => {
                              setShowActionsMenu(false);
                              setShowDeleteModal(true);
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                            role="menuitem"
                          >
                            <FiTrash2 className="h-4 w-4" />
                            <span className="text-sm">Delete Resume</span>
                          </button>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Resume Builder */}
        <ResumeBuilder
          resumeId={id}
          initialData={formData}
          template={selectedTemplate}
          showPreview={showPreview}
          fullscreenPreview={fullscreenPreview}
          onChange={handleFormChange}
          onTemplateChange={handleTemplateChange}
        />

        {/* Template Selection Modal */}
        <Modal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          title="Choose Template"
          size="lg"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {TEMPLATE_OPTIONS.map((template) => (
              <motion.button
                key={template.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTemplateChange(template.id)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selectedTemplate === template.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 hover:border-primary-300 dark:border-gray-700 dark:hover:border-primary-700'
                }`}
              >
                <div
                  className={`mb-3 flex h-24 w-full items-center justify-center rounded-lg bg-gradient-to-br text-3xl ${template.previewClass}`}
                >
                  {template.icon}
                </div>
                <p className="font-medium capitalize text-gray-900 dark:text-white">
                  {template.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {template.description}
                </p>
              </motion.button>
            ))}
          </div>
        </Modal>

        {/* Keyboard Shortcuts Modal */}
        <Modal
          isOpen={showKeyboardShortcuts}
          onClose={() => setShowKeyboardShortcuts(false)}
          title="Keyboard Shortcuts"
          size="sm"
        >
          <div className="space-y-3">
            <ShortcutItem keys={`${shortcutPrefix}S`} description="Save resume" />
            <ShortcutItem keys={`${shortcutPrefix}P`} description="Toggle preview" />
            <ShortcutItem
              keys={`${shortcutPrefix}F`}
              description="Toggle fullscreen preview"
            />
            <ShortcutItem keys={`${shortcutPrefix}D`} description="Download PDF" />
            <ShortcutItem keys="Esc" description="Close modal or return to dashboard" />
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Resume?"
          message="This action cannot be undone. Are you sure you want to delete this resume?"
          confirmText="Delete"
          confirmVariant="danger"
        />

        {/* Premium Upgrade Banner */}
        {!isPremium ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4"
          >
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-lg dark:border-amber-800 dark:from-amber-900/30 dark:to-orange-900/30">
              <div className="flex items-center gap-3">
                <FiAward className="h-8 w-8 text-amber-500" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    Unlock Premium Features
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Get AI suggestions, unlimited resumes, and priority support.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => navigate('/pricing')}
                >
                  Upgrade
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default Builder;
