import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiLinkedin,
  FiGithub,
  FiGlobe,
  FiCheckCircle,
  FiAlertCircle,
  FiUpload,
  FiCamera,
  FiX,
  FiExternalLink,
  FiBriefcase,
  FiSave,
  FiEdit2,
  FiCopy,
  FiEye,
  FiLoader,
  FiZap,
} from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Progress from '../../ui/Progress';
import Card from '../../ui/Card';
import Modal from '../../ui/Modal';
import { useAuth } from '../../../hooks/useAuth';
import { useDebouncedCallback } from '../../../hooks/useDebounce';
import { storageService } from '../../../services/storageService';
import aiService from '../../../services/aiService';
import toast from 'react-hot-toast';

// ── Form Field Configuration ─────────────────────────────────────────────

const FORM_FIELDS = [
  {
    name: 'fullName',
    label: 'Full Name',
    icon: FiUser,
    required: true,
    placeholder: 'John Doe',
    validation: { required: 'Full name is required' },
  },
  {
    name: 'title',
    label: 'Professional Title',
    icon: FiBriefcase,
    required: true,
    placeholder: 'Senior Software Engineer',
    validation: { required: 'Professional title is required' },
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    icon: FiMail,
    required: true,
    placeholder: 'john.doe@example.com',
    validation: {
      required: 'Email is required',
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Invalid email address',
      },
    },
  },
  {
    name: 'phone',
    label: 'Phone Number',
    icon: FiPhone,
    required: true,
    placeholder: '+1 (555) 123-4567',
    validation: { required: 'Phone number is required' },
  },
  {
    name: 'location',
    label: 'Location',
    icon: FiMapPin,
    placeholder: 'Karachi, Sindh | PK',
    validation: {},
  },
  {
    name: 'website',
    label: 'Website/Portfolio',
    icon: FiGlobe,
    placeholder: 'https://johndoe.com',
    // The `\/` escapes outside character classes are required - without
    // them, the `/` would terminate the regex literal. The escapes that
    // used to appear inside `[...]` were unnecessary: `.`, `/`, and a
    // trailing `-` are all literal inside a character class.
    validation: {
      pattern: {
        value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
        message: 'Invalid URL',
      },
    },
  },
  {
    name: 'linkedin',
    label: 'LinkedIn Profile',
    icon: FiLinkedin,
    placeholder: 'linkedin.com/in/johndoe',
  },
  {
    name: 'github',
    label: 'GitHub Profile',
    icon: FiGithub,
    placeholder: 'github.com/johndoe',
  },
];

const COMPLETION_FIELDS = [
  'fullName',
  'title',
  'email',
  'phone',
  'location',
  'summary',
  'linkedin',
  'github',
];

// Stable key used by `aiService` to deduplicate and supersede AI requests
// for the summary field. A second click on "AI Suggest" aborts the
// previous request so its response cannot overwrite newer content.
const AI_SUMMARY_REQUEST_KEY = 'personal-info-summary';

// The set of fields synced from the `data` prop into react-hook-form.
// Used by both the initial `defaultValues` and the guarded sync effect so
// the two lists can never drift apart.
const SYNCED_FIELD_NAMES = [
  'fullName',
  'title',
  'email',
  'phone',
  'location',
  'website',
  'linkedin',
  'github',
  'summary',
];

/**
 * Builds the plain object react-hook-form expects from the `data` prop.
 * All fields are normalized to strings so `JSON.stringify` produces a
 * stable, comparable signature and `reset` never receives `undefined`.
 */
const buildFormValuesFromData = (data) => {
  const values = {};
  for (const key of SYNCED_FIELD_NAMES) {
    values[key] = data?.[key] || '';
  }
  return values;
};

// ── Helper ────────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Component ─────────────────────────────────────────────────────────────

const PersonalInfo = ({ data = {}, onChange, onValidationChange }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState(data.profileImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);

  // Snapshot of the last values we synced from the `data` prop into the
  // form. The parent recomputes the section data on every render, so the
  // `data` prop is a new object reference on every parent render even when
  // its contents are unchanged. Without this guard, `reset` re-ran on
  // every parent render, wiping any in-flight typing and (combined with
  // the completion effect below) driving the "Maximum update depth
  // exceeded" loop that React was reporting at this effect.
  const lastResetSnapshotRef = useRef('');

  // Snapshot of the last payload we sent to `onValidationChange`. See the
  // completion effect below for why this guard exists.
  const lastValidationSignatureRef = useRef('');

  // Ref that always holds the latest `onValidationChange` callback. The
  // parent passes a fresh inline arrow on every render, which would
  // otherwise force the completion effect to fire on every parent render
  // even when the values it cares about have not changed.
  const onValidationChangeRef = useRef(onValidationChange);

  useEffect(() => {
    onValidationChangeRef.current = onValidationChange;
  });

  // `handleSubmit` is intentionally not destructured here. The component
  // does not render a <form> and does not use react-hook-form's submit
  // pipeline - saving is performed by `handleManualSave` and the debounced
  // autosave, both of which call `trigger()` directly for validation.
  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: buildFormValuesFromData(data),
    mode: 'onChange',
  });

  const watchedFields = watch();

  // ── Sync external data changes ────────────────────────────────────────
  // Guarded: only reset when the incoming values actually differ from the
  // last reset. Same pattern as the sibling sections (Experience,
  // Education, Projects, Skills, Certifications) - PersonalInfo was the
  // only section that reset unconditionally.

  useEffect(() => {
    const next = buildFormValuesFromData(data);
    const snapshot = JSON.stringify(next);
    if (snapshot === lastResetSnapshotRef.current) return;
    lastResetSnapshotRef.current = snapshot;
    reset(next);
  }, [data, reset]);

  useEffect(() => {
    setProfileImageUrl(data.profileImage || null);
  }, [data.profileImage]);

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cancel any in-flight AI request so its late response cannot set
      // state on an unmounted component. `aiService.cancel` is a no-op
      // when there is nothing in flight.
      aiService.cancel(AI_SUMMARY_REQUEST_KEY);
    };
  }, []);

  // ── Validation Functions ──────────────────────────────────────────────

  const validatePhone = useCallback((phone) => {
    if (!phone) return true;
    return /^\+?[\d\s\-().]{7,20}$/.test(phone) || 'Please enter a valid phone number';
  }, []);

  const validateLinkedIn = useCallback((url) => {
    if (!url) return true;
    return /^https?:\/\/(www\.)?linkedin\.com\/in\//.test(url)
      ? true
      : 'Enter a valid LinkedIn URL (e.g., https://linkedin.com/in/...)';
  }, []);

  const validateGitHub = useCallback((url) => {
    if (!url) return true;
    return /^https?:\/\/(www\.)?github\.com\//.test(url)
      ? true
      : 'Enter a valid GitHub URL (e.g., https://github.com/...)';
  }, []);

  // ── Completion Calculation ────────────────────────────────────────────
  //
  // `watch()` returns a new object reference on every render, and the
  // parent passes a fresh inline arrow for `onValidationChange`. Without
  // the signature guard below, this effect fired on every render, called
  // the parent's `setSectionErrors`, forced the parent to re-render, and
  // re-triggered the effect - the exact loop React reported.
  //
  // The `setCompletionPercentage` call still runs on every fire (it is
  // cheap; React bails out when the value has not changed), but the
  // parent callback is only invoked when the meaningful values change.

  useEffect(() => {
    const filled = COMPLETION_FIELDS.filter((field) =>
      watchedFields[field]?.toString().trim()
    ).length;
    const percentage = Math.round((filled / COMPLETION_FIELDS.length) * 100);
    setCompletionPercentage(percentage);

    const hasErrors = Object.keys(errors).length > 0;
    const signature = `${filled}|${hasErrors}`;
    if (signature === lastValidationSignatureRef.current) return;
    lastValidationSignatureRef.current = signature;

    onValidationChangeRef.current?.({
      isValid: !hasErrors,
      completionPercentage: percentage,
    });
  }, [watchedFields, errors]);

  // ── Save Handler ──────────────────────────────────────────────────────

  const handleSave = useCallback(
    async (formData) => {
      if (!mountedRef.current) return;
      setIsSaving(true);
      setAutoSaveStatus('saving');

      try {
        const isValid = await trigger();
        if (!isValid) {
          setAutoSaveStatus('error');
          return;
        }

        const dataToSave = {
          ...formData,
          profileImage: profileImageUrl,
          lastUpdated: new Date().toISOString(),
        };
        onChange?.(dataToSave);
        setAutoSaveStatus('saved');
        setTimeout(() => {
          if (mountedRef.current) setAutoSaveStatus('idle');
        }, 3000);
      } catch (error) {
        console.error('Save error:', error);
        setAutoSaveStatus('error');
      } finally {
        if (mountedRef.current) setIsSaving(false);
      }
    },
    [profileImageUrl, onChange, trigger]
  );

  // ── Debounced Auto-Save (shared hook) ─────────────────────────────────

  const { debouncedCallback: debouncedSave } = useDebouncedCallback(handleSave, 1000);

  useEffect(() => {
    if (isDirty && isEditing) {
      debouncedSave(watchedFields);
    }
  }, [watchedFields, isDirty, isEditing, debouncedSave]);

  // ── Manual Save ───────────────────────────────────────────────────────

  const handleManualSave = useCallback(async () => {
    const valid = await trigger();
    if (valid) {
      await handleSave(watchedFields);
      toast.success('Personal information saved!');
    } else {
      toast.error('Please fix validation errors before saving');
    }
  }, [trigger, handleSave, watchedFields]);

  // ── Image Upload ──────────────────────────────────────────────────────

  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setIsUploading(true);
      try {
        const userId = user?.uid || 'anonymous';
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `avatars/${userId}/profile-image-${Date.now()}-${safeFileName}`;
        const downloadURL = await storageService.uploadFile(path, file);
        if (mountedRef.current) {
          setProfileImageUrl(downloadURL);
          setValue('profileImage', downloadURL);
          toast.success('Profile image uploaded!');
        }
      } catch (error) {
        console.error('Image upload failed:', error);
        toast.error('Failed to upload image');
      } finally {
        if (mountedRef.current) setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [user?.uid, setValue]
  );

  const removeImage = useCallback(() => {
    setProfileImageUrl(null);
    setValue('profileImage', null);
  }, [setValue]);

  // ── Local Summary Generator (unchanged behaviour, kept as fallback) ───

  /**
   * Builds the local fallback summary text from the user's name and title.
   * Returns `null` when either field is missing, so callers can decide
   * whether to show an error or fall back silently.
   *
   * Extracted from the previous inline implementation so the AI handler
   * and the local "Generate Suggestion" button can share the same string
   * without duplicating it.
   */
  const buildLocalSummary = useCallback(() => {
    const { fullName, title } = watchedFields;
    if (!fullName || !title) return null;
    return `${fullName} is a dedicated ${title} with a proven track record of delivering high-quality results. Passionate about innovation and continuous improvement, with strong problem-solving abilities and excellent communication skills.`;
  }, [watchedFields]);

  const generateSummarySuggestion = useCallback(() => {
    const suggestion = buildLocalSummary();
    if (suggestion) {
      setValue('summary', suggestion, { shouldValidate: true });
      toast.success('Summary suggestion generated!');
    } else {
      toast.error('Please enter your name and title first');
    }
  }, [buildLocalSummary, setValue]);

  // ── AI Summary Generator (C-04) ───────────────────────────────────────

  /**
   * Requests a summary suggestion from the AI endpoint.
   *
   * Task selection:
   *   • When the summary field already has content, use `improve_summary`
   *     so the model rewrites the existing text rather than starting over.
   *   • When the summary field is empty, use `generate_summary` so the
   *     model produces a fresh summary from name and title.
   *
   * Fallback:
   *   On any non-success result — network, timeout, rate limit, upstream
   *   error, or auth — the AI button reverts to idle and the local
   *   generator is invoked so the user still gets a suggestion. A single
   *   toast informs the user that the AI path was unavailable; the local
   *   generator's own success toast is suppressed in this path to avoid
   *   two competing messages.
   *
   * Aborting:
   *   A second click on "AI Suggest" while a request is in flight is
   *   ignored because the button is disabled. The request key is stable
   *   across the component's lifetime; if the component unmounts, the
   *   cleanup in the lifecycle effect cancels the pending request.
   */
  const handleGenerateSummaryWithAi = useCallback(async () => {
    if (isAiGenerating) return;

    const { fullName, title, summary } = watchedFields;
    const hasExistingSummary = Boolean(summary && summary.trim().length > 0);

    // Input pre-flight: for a fresh summary, we need at least name and
    // title, otherwise the AI response will be a generic placeholder. For
    // an improve request, we only need the existing text.
    if (!hasExistingSummary && (!fullName || !title)) {
      toast.error('Please enter your name and title first');
      return;
    }

    setIsAiGenerating(true);

    let result;
    try {
      if (hasExistingSummary) {
        result = await aiService.improveSummary(
          { text: summary, title: title || '' },
          { requestKey: AI_SUMMARY_REQUEST_KEY }
        );
      } else {
        result = await aiService.generateSummary(
          { fullName, title },
          { requestKey: AI_SUMMARY_REQUEST_KEY }
        );
      }
    } catch (error) {
      // The service layer is designed never to throw, but a future change
      // there must not break this component. Treat an unexpected throw as
      // an upstream failure.
      if (process.env.NODE_ENV === 'development') {
        console.warn('aiService threw unexpectedly:', error);
      }
      result = {
        success: false,
        error: 'AI service is temporarily unavailable.',
        code: 'upstream',
      };
    }

    if (!mountedRef.current) return;

    // A superseded or aborted request is not a user-visible error. Either
    // a newer request is taking over, or the component is unmounting.
    if (!result.success && (result.code === 'aborted' || result.code === 'superseded')) {
      setIsAiGenerating(false);
      return;
    }

    if (result.success) {
      setValue('summary', result.text, { shouldValidate: true, shouldDirty: true });
      toast.success('Summary generated with AI!');
      setIsAiGenerating(false);
      return;
    }

    // Fall back to the local generator. If the local generator cannot run
    // (because name/title are missing, which the pre-flight should have
    // caught), show the AI error directly.
    const fallbackText = buildLocalSummary();
    if (fallbackText) {
      setValue('summary', fallbackText, { shouldValidate: true, shouldDirty: true });
      toast(result.error || 'AI is unavailable — used local suggestion.', {
        icon: 'ℹ️',
        duration: 4000,
      });
    } else {
      toast.error(result.error || 'AI service is temporarily unavailable.');
    }

    setIsAiGenerating(false);
  }, [isAiGenerating, watchedFields, setValue, buildLocalSummary]);

  // ── Copy to Clipboard ─────────────────────────────────────────────────

  const copyToClipboard = useCallback(
    (field) => {
      const text = watchedFields[field];
      if (text) {
        navigator.clipboard
          ?.writeText(text)
          .then(() => toast.success(`${field} copied!`))
          .catch(() => toast.error('Failed to copy'));
      }
    },
    [watchedFields]
  );

  // ── Animation Variants ────────────────────────────────────────────────

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">Personal Information</h3>
            {completionPercentage === 100 && (
              <Badge variant="success">
                <FiCheckCircle className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xs">
              <Progress value={completionPercentage} size="sm" showPercentage />
            </div>
            <AutoSaveStatus status={autoSaveStatus} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} icon={<FiEye />}>
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            icon={<FiEdit2 />}
          >
            {isEditing ? 'View' : 'Edit'}
          </Button>
          <Button size="sm" onClick={handleManualSave} loading={isSaving} icon={<FiSave />}>
            Save
          </Button>
        </div>
      </div>

      {/* Profile Image */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-4 border-primary-100 dark:border-primary-900">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="w-12 h-12 text-gray-400" />
                )}
              </div>
              {isEditing && (
                <>
                  <label
                    className={cn(
                      'absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full cursor-pointer shadow-lg transition-colors',
                      isUploading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-600'
                    )}
                  >
                    {isUploading ? (
                      <FiLoader className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiCamera className="w-4 h-4" />
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  {profileImageUrl && (
                    <button
                      onClick={removeImage}
                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      aria-label="Remove profile image"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-semibold mb-1">Profile Photo</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Add a professional photo to make your resume stand out
              </p>
              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={isUploading ? <FiLoader className="animate-spin" /> : <FiUpload />}
                  disabled={isUploading}
                >
                  Upload Photo
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Form Fields */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FORM_FIELDS.map((field) => (
              <div key={field.name} className="relative">
                <Input
                  label={field.label}
                  type={field.type || 'text'}
                  icon={<field.icon />}
                  placeholder={field.placeholder}
                  disabled={!isEditing}
                  {...register(field.name, {
                    ...field.validation,
                    ...(field.name === 'phone' && { validate: validatePhone }),
                    ...(field.name === 'linkedin' && { validate: validateLinkedIn }),
                    ...(field.name === 'github' && { validate: validateGitHub }),
                  })}
                  error={errors[field.name]?.message}
                />
                <div className="absolute right-2 top-9 flex gap-1">
                  {watchedFields[field.name] && !errors[field.name] && (
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {isEditing && watchedFields[field.name] && (
                    <button
                      onClick={() => copyToClipboard(field.name)}
                      className="text-gray-400 hover:text-gray-600"
                      type="button"
                      aria-label={`Copy ${field.label}`}
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Professional Summary
              </label>
              {isEditing && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateSummaryWithAi}
                    loading={isAiGenerating}
                    disabled={isAiGenerating}
                    icon={<FiZap className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    {isAiGenerating ? 'Generating…' : 'AI Suggest'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateSummarySuggestion}
                    className="text-xs"
                    disabled={isAiGenerating}
                  >
                    Generate Suggestion
                  </Button>
                </div>
              )}
            </div>
            <textarea
              {...register('summary', {
                minLength: { value: 50, message: 'Summary should be at least 50 characters' },
                maxLength: { value: 500, message: 'Summary should not exceed 500 characters' },
              })}
              rows={4}
              disabled={!isEditing}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.summary
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none resize-none disabled:opacity-50 text-sm`}
              placeholder="Write a compelling summary of your professional background..."
            />
            <div className="flex justify-between mt-1">
              {errors.summary && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" />
                  {errors.summary.message}
                </p>
              )}
              <p className="text-xs text-gray-400 ml-auto">
                {watchedFields.summary?.length || 0}/500
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Profile Preview"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg">
            {profileImageUrl && (
              <img
                src={profileImageUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="text-lg font-bold">{watchedFields.fullName || 'Your Name'}</h3>
              <p className="text-primary-600 dark:text-primary-400">
                {watchedFields.title || 'Professional Title'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {[
              { field: 'email', icon: FiMail, label: 'Email' },
              { field: 'phone', icon: FiPhone, label: 'Phone' },
              { field: 'location', icon: FiMapPin, label: 'Location' },
              { field: 'linkedin', icon: FiLinkedin, label: 'LinkedIn', isLink: true },
              { field: 'github', icon: FiGithub, label: 'GitHub', isLink: true },
            ].map(
              ({ field, icon: Icon, label, isLink }) =>
                watchedFields[field] && (
                  <div key={field} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-400" />
                    {isLink ? (
                      <a
                        href={watchedFields[field]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                      >
                        {label} <FiExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-sm">{watchedFields[field]}</span>
                    )}
                  </div>
                )
            )}
          </div>
          {watchedFields.summary && (
            <div className="p-4">
              <h4 className="font-semibold mb-2">Professional Summary</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{watchedFields.summary}</p>
            </div>
          )}
        </div>
      </Modal>
    </motion.div>
  );
};

// ── Auto-Save Status Component ────────────────────────────────────────────

const AutoSaveStatus = React.memo(({ status }) => {
  const config = {
    saving: { icon: null, text: 'Saving...', className: 'text-gray-500' },
    saved: { icon: FiCheckCircle, text: 'Saved', className: 'text-green-500' },
    error: { icon: FiAlertCircle, text: 'Error saving', className: 'text-red-500' },
    idle: null,
  };

  const current = config[status];
  if (!current) return null;

  return (
    <span className={`text-xs flex items-center gap-1 ${current.className}`}>
      {current.icon && <current.icon className="w-3 h-3" />}
      {current.text}
    </span>
  );
});

AutoSaveStatus.displayName = 'AutoSaveStatus';

export default React.memo(PersonalInfo);
