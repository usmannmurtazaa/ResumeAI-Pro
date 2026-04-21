import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSave, FiEye, FiDownload, FiChevronLeft, FiChevronRight,
  FiCheckCircle, FiAlertCircle, FiLoader, FiZap, FiTarget,
  FiLayout, FiShare2, FiMoreHorizontal, FiRefreshCw,
  FiArrowLeft, FiInfo, FiStar, FiAward, FiTrendingUp,
  FiEdit3, FiCopy, FiTrash2, FiMaximize2, FiMinimize2,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useResume } from '../contexts/ResumeContext';
import { useDebounce } from '../hooks/useDebounce';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import ResumeBuilder from '../components/resume/ResumeBuilder';
import DashboardLayout from '../layouts/DashboardLayout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import Tooltip from '../components/ui/Tooltip';
import Modal from '../components/ui/Modal';
import Loader from '../components/common/Loader';
import { ConfirmModal } from '../components/ui/Modal';
import { calculateATSScore } from '../utils/atsKeywords';
import { generatePDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

// ============================================
// BUILDER PAGE COMPONENT
// ============================================

const Builder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isPremium } = useAuth();
  const { resume, loading, error, createResume, updateResume, autoSaveResume, duplicateResume, deleteResume } = useResume(id);

  const [formData, setFormData] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showPreview, setShowPreview] = useState(() => {
    return localStorage.getItem('builder_preview') !== 'false';
  });
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [atsScore, setAtsScore] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [resumeName, setResumeName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef(null);

  const debouncedFormData = useDebounce(formData, 1500);

  // Load resume data
  useEffect(() => {
    if (resume) {
      setFormData(resume.data || {});
      setSelectedTemplate(resume.template || 'modern');
      setResumeName(resume.name || 'Untitled Resume');
      calculateCompletion(resume.data || {});
      const score = calculateATSScore(resume.data || {});
      setAtsScore(score);
    }
  }, [resume]);

  // Auto-save
  useEffect(() => {
    if (Object.keys(debouncedFormData).length > 0 && id) {
      handleAutoSave();
    }
  }, [debouncedFormData]);

  // Save preview preference
  useEffect(() => {
    localStorage.setItem('builder_preview', showPreview);
  }, [showPreview]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Focus name input when editing
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Keyboard Shortcuts
  useKeyboardShortcut('s', handleManualSave, { ctrl: true });
  useKeyboardShortcut('p', () => setShowPreview(!showPreview), { ctrl: true });
  useKeyboardShortcut('d', handleDownload, { ctrl: true });
  useKeyboardShortcut('f', () => setFullscreenPreview(!fullscreenPreview), { ctrl: true });
  useKeyboardShortcut('Escape', () => {
    if (fullscreenPreview) setFullscreenPreview(false);
    else navigate('/dashboard');
  });

  const calculateCompletion = (data) => {
    const sections = ['personal', 'education', 'experience', 'skills', 'projects', 'certifications'];
    const completed = sections.filter((section) => {
      const sectionData = data[section];
      if (!sectionData) return false;
      if (section === 'personal') return sectionData.fullName && sectionData.email;
      if (Array.isArray(sectionData)) return sectionData.length > 0;
      return Object.keys(sectionData).length > 0;
    });
    setCompletionPercentage((completed.length / sections.length) * 100);
  };

  const handleAutoSave = async () => {
    if (!id) return;

    setAutoSaveStatus('saving');
    try {
      const score = calculateATSScore(formData);
      setAtsScore(score);
      calculateCompletion(formData);

      await autoSaveResume(id, formData);
      await updateResume(id, { template: selectedTemplate });

      setAutoSaveStatus('saved');
      setHasUnsavedChanges(false);
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      toast.error('Failed to auto-save');
    }
  };

  const handleManualSave = async () => {
    if (!id) {
      try {
        const newResume = await createResume({
          data: formData,
          template: selectedTemplate,
          name: resumeName,
        });
        toast.success('Resume created successfully!');
        navigate(`/builder/${newResume.id}`);
      } catch (error) {
        toast.error('Failed to create resume');
      }
    } else {
      await handleAutoSave();
      toast.success('Resume saved successfully!');
    }
  };

  const handleNameSave = async () => {
    if (id && resumeName.trim()) {
      await updateResume(id, { name: resumeName.trim() });
      toast.success('Resume name updated');
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') handleNameSave();
    if (e.key === 'Escape') {
      setResumeName(resume?.name || 'Untitled Resume');
      setIsEditingName(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await generatePDF(formData, selectedTemplate);
      toast.success('Resume downloaded successfully!');

      if (id) {
        await updateResume(id, {
          downloadCount: (resume?.downloadCount || 0) + 1,
          lastDownloaded: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download resume');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTemplateChange = (template) => {
    setSelectedTemplate(template);
    setShowTemplateModal(false);
    setHasUnsavedChanges(true);
    toast.success(`Template changed to ${template}`);
  };

  const handleFormChange = (data) => {
    setFormData(data);
    setHasUnsavedChanges(true);
  };

  const handleDuplicate = async () => {
    if (!id) return;
    try {
      const duplicated = await duplicateResume(resume);
      toast.success('Resume duplicated!');
      navigate(`/builder/${duplicated.id}`);
    } catch (error) {
      toast.error('Failed to duplicate resume');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteResume(id);
      toast.success('Resume deleted');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to delete resume');
    }
    setShowDeleteModal(false);
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (score >= 80) return { grade: 'A', color: 'text-green-500' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-500' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-500' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-500' };
    return { grade: 'F', color: 'text-red-500' };
  };

  const scoreGrade = getScoreGrade(atsScore);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader size="lg" message="Loading resume builder..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <FiAlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load resume</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={id ? 'Edit Resume' : 'Create New Resume'} showWelcome={false}>
      <div className="max-w-7xl mx-auto">
        {/* Builder Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="glass-card p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Tooltip content="Back to Dashboard (Esc)">
                  <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                </Tooltip>

                <div>
                  {isEditingName && id ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={resumeName}
                        onChange={(e) => setResumeName(e.target.value)}
                        onBlur={handleNameSave}
                        onKeyDown={handleNameKeyDown}
                        className="text-xl font-semibold bg-transparent border-b-2 border-primary-500 outline-none px-1"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold">{id ? resumeName : 'Create New Resume'}</h1>
                      {id && (
                        <button onClick={() => setIsEditingName(true)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                          <FiEdit3 className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>Template: <span className="capitalize">{selectedTemplate}</span></span>
                    <button onClick={() => setShowTemplateModal(true)} className="text-primary-500 hover:text-primary-600">Change</button>
                    {hasUnsavedChanges && <span className="text-yellow-500">• Unsaved changes</span>}
                  </div>
                </div>
              </div>

              <div className="flex-1 max-w-md">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Completion</span>
                    <span className="font-medium">{Math.round(completionPercentage)}%</span>
                  </div>
                  <Progress value={completionPercentage} size="sm" color={completionPercentage >= 80 ? 'success' : completionPercentage >= 50 ? 'warning' : 'danger'} />

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <FiTarget className="w-4 h-4" />
                      <span className="text-gray-600 dark:text-gray-400">ATS Score</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={atsScore >= 80 ? 'success' : atsScore >= 60 ? 'warning' : 'danger'} size="sm">
                        Grade {scoreGrade.grade}
                      </Badge>
                      <span className={`font-medium ${scoreGrade.color}`}>{atsScore}%</span>
                    </div>
                  </div>
                  <Progress value={atsScore} size="sm" color={atsScore >= 80 ? 'success' : atsScore >= 60 ? 'warning' : 'danger'} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {autoSaveStatus === 'saving' && <Badge variant="secondary" className="flex items-center gap-1"><FiLoader className="w-3 h-3 animate-spin" />Saving...</Badge>}
                {autoSaveStatus === 'saved' && <Badge variant="success" className="flex items-center gap-1"><FiCheckCircle className="w-3 h-3" />Saved</Badge>}
                {autoSaveStatus === 'error' && <Badge variant="danger" className="flex items-center gap-1"><FiAlertCircle className="w-3 h-3" />Error</Badge>}

                <Tooltip content="Toggle Preview (⌘P)">
                  <Button variant={showPreview ? 'primary' : 'outline'} size="sm" onClick={() => setShowPreview(!showPreview)} icon={<FiEye />}>
                    {showPreview ? 'Hide' : 'Preview'}
                  </Button>
                </Tooltip>

                <Tooltip content="Save (⌘S)">
                  <Button variant="outline" size="sm" onClick={handleManualSave} icon={<FiSave />}>Save</Button>
                </Tooltip>

                <Tooltip content="Download PDF (⌘D)">
                  <Button size="sm" onClick={handleDownload} loading={isDownloading} icon={<FiDownload />} className="bg-gradient-to-r from-primary-500 to-accent-500">
                    Download
                  </Button>
                </Tooltip>

                <Tooltip content="More Options">
                  <button onClick={() => setShowKeyboardShortcuts(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <FiMoreHorizontal className="w-5 h-5" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Builder Content */}
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
        <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Choose Template" size="lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {['modern', 'classic', 'creative', 'minimal', 'executive', 'tech'].map((template) => (
              <motion.button
                key={template}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTemplateChange(template)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedTemplate === template ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'}`}
              >
                <div className={`w-full h-24 rounded-lg bg-gradient-to-br mb-3 ${template === 'modern' ? 'from-blue-500 to-cyan-500' : template === 'classic' ? 'from-gray-600 to-gray-800' : template === 'creative' ? 'from-purple-500 to-pink-500' : template === 'minimal' ? 'from-green-500 to-emerald-500' : template === 'executive' ? 'from-slate-700 to-slate-900' : 'from-indigo-500 to-blue-600'} flex items-center justify-center text-3xl`}>
                  {template === 'modern' && '🎨'}{template === 'classic' && '📄'}{template === 'creative' && '✨'}{template === 'minimal' && '◻️'}{template === 'executive' && '👔'}{template === 'tech' && '💻'}
                </div>
                <p className="font-medium capitalize">{template}</p>
                <p className="text-xs text-gray-500">{template === 'modern' ? 'Clean & contemporary' : template === 'classic' ? 'Traditional format' : template === 'creative' ? 'Stand out design' : template === 'minimal' ? 'Simple & elegant' : template === 'executive' ? 'Senior positions' : 'Tech industry focus'}</p>
              </motion.button>
            ))}
          </div>
        </Modal>

        {/* Keyboard Shortcuts Modal */}
        <Modal isOpen={showKeyboardShortcuts} onClose={() => setShowKeyboardShortcuts(false)} title="Keyboard Shortcuts" size="sm">
          <div className="space-y-3">
            <ShortcutItem keys="⌘S" description="Save resume" />
            <ShortcutItem keys="⌘P" description="Toggle preview" />
            <ShortcutItem keys="⌘F" description="Fullscreen preview" />
            <ShortcutItem keys="⌘D" description="Download PDF" />
            <ShortcutItem keys="⌘Z" description="Undo" />
            <ShortcutItem keys="⌘⇧Z" description="Redo" />
            <ShortcutItem keys="Esc" description="Back to dashboard" />
            <ShortcutItem keys="Alt ←/→" description="Navigate sections" />
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

        {/* Premium Features Banner */}
        {!isPremium && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 max-w-md w-full px-4">
            <div className="glass-card p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <FiAward className="w-8 h-8 text-amber-500" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800 dark:text-amber-300">Unlock Premium Features</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">Get AI suggestions, unlimited resumes, and priority support</p>
                </div>
                <Button size="sm" variant="warning" onClick={() => navigate('/pricing')}>Upgrade</Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

// Shortcut Item Component
const ShortcutItem = ({ keys, description }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <span className="text-sm text-gray-600 dark:text-gray-400">{description}</span>
    <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded font-mono">{keys}</kbd>
  </div>
);

export default Builder;