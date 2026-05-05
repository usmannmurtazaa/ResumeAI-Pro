import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiLinkedin, FiGithub, FiGlobe,
  FiCheckCircle, FiAlertCircle, FiInfo, FiUpload, FiCamera, FiX,
  FiExternalLink, FiBriefcase, FiAward, FiSave, FiEdit2, FiCopy, FiEye,
} from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Progress from '../../ui/Progress';
import Tooltip from '../../ui/Tooltip';
import Card from '../../ui/Card';
import Modal from '../../ui/Modal';
import toast from 'react-hot-toast';

// ── Simple Debounce Hook (No External Dependencies) ───────────────────────

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

// ── Form Field Configuration ─────────────────────────────────────────────

const FORM_FIELDS = [
  { name: 'fullName', label: 'Full Name', icon: FiUser, required: true, placeholder: 'John Doe', validation: { required: 'Full name is required' } },
  { name: 'title', label: 'Professional Title', icon: FiBriefcase, required: true, placeholder: 'Senior Software Engineer', validation: { required: 'Professional title is required' } },
  { name: 'email', label: 'Email Address', type: 'email', icon: FiMail, required: true, placeholder: 'john.doe@example.com', validation: { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } } },
  { name: 'phone', label: 'Phone Number', icon: FiPhone, required: true, placeholder: '+1 (555) 123-4567', validation: { required: 'Phone number is required' } },
  { name: 'location', label: 'Location', icon: FiMapPin, placeholder: 'San Francisco, CA', validation: {} },
  { name: 'website', label: 'Website/Portfolio', icon: FiGlobe, placeholder: 'https://johndoe.com', validation: { pattern: { value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, message: 'Invalid URL' } } },
  { name: 'linkedin', label: 'LinkedIn Profile', icon: FiLinkedin, placeholder: 'linkedin.com/in/johndoe' },
  { name: 'github', label: 'GitHub Profile', icon: FiGithub, placeholder: 'github.com/johndoe' },
];

const COMPLETION_FIELDS = ['fullName', 'title', 'email', 'phone', 'location', 'summary', 'linkedin', 'github'];

// ── Component ─────────────────────────────────────────────────────────────

const PersonalInfo = ({ data = {}, onChange, onValidationChange }) => {
  const [isEditing, setIsEditing] = useState(true);
  const [profileImage, setProfileImage] = useState(data.profileImage || null);
  const [imagePreview, setImagePreview] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);

  const { 
    register, handleSubmit, watch, setValue, trigger,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: {
      fullName: '', title: '', email: '', phone: '',
      location: '', website: '', linkedin: '', github: '',
      summary: '', ...data,
    },
    mode: 'onChange',
  });

  const watchedFields = watch();

  // ── Validation Functions (Memoized) ───────────────────────────────────

  const validatePhone = useCallback((phone) => {
    if (!phone) return true;
    return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone) || 'Please enter a valid phone number';
  }, []);

  const validateLinkedIn = useCallback((url) => {
    if (!url) return true;
    return url.includes('linkedin.com/in/') || 'Enter a valid LinkedIn URL (linkedin.com/in/...)';
  }, []);

  const validateGitHub = useCallback((url) => {
    if (!url) return true;
    return url.includes('github.com/') || 'Enter a valid GitHub URL (github.com/...)';
  }, []);

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Completion Calculation ────────────────────────────────────────────

  useEffect(() => {
    const filled = COMPLETION_FIELDS.filter(field => watchedFields[field]?.toString().trim()).length;
    const percentage = Math.round((filled / COMPLETION_FIELDS.length) * 100);
    setCompletionPercentage(percentage);
    onValidationChange?.({
      isValid: Object.keys(errors).length === 0,
      completionPercentage: percentage,
    });
  }, [watchedFields, errors, onValidationChange]);

  // ── Save Handler ──────────────────────────────────────────────────────

  const handleSave = useCallback(async (formData) => {
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
        profileImage,
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
  }, [profileImage, onChange, trigger]);

  // ── Debounced Auto-Save ───────────────────────────────────────────────

  const debouncedSave = useDebounce(handleSave, 1000);

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

  const handleImageUpload = useCallback((e) => {
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

    const reader = new FileReader();
    reader.onloadend = () => {
      if (!mountedRef.current) return;
      const result = reader.result;
      setProfileImage(result);
      setImagePreview(result);
      setValue('profileImage', result);
      toast.success('Profile image uploaded!');
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  }, [setValue]);

  const removeImage = useCallback(() => {
    setProfileImage(null);
    setImagePreview(null);
    setValue('profileImage', null);
    // Revoke object URL if it was created
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
  }, [imagePreview, setValue]);

  // ── Summary Generator ─────────────────────────────────────────────────

  const generateSummarySuggestion = useCallback(() => {
    const { fullName, title } = watchedFields;
    if (fullName && title) {
      const suggestion = `${fullName} is a dedicated ${title} with a proven track record of delivering high-quality results. Passionate about innovation and continuous improvement, with strong problem-solving abilities and excellent communication skills.`;
      setValue('summary', suggestion, { shouldValidate: true });
      toast.success('Summary suggestion generated!');
    } else {
      toast.error('Please enter your name and title first');
    }
  }, [watchedFields, setValue]);

  // ── Copy to Clipboard ─────────────────────────────────────────────────

  const copyToClipboard = useCallback((field) => {
    const text = watchedFields[field];
    if (text) {
      navigator.clipboard?.writeText(text).then(() => {
        toast.success(`${field} copied!`);
      }).catch(() => {
        toast.error('Failed to copy');
      });
    }
  }, [watchedFields]);

  // ── Animation Variants ────────────────────────────────────────────────

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">Personal Information</h3>
            {completionPercentage === 100 && (
              <Badge variant="success"><FiCheckCircle className="w-3 h-3 mr-1" />Complete</Badge>
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
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} icon={<FiEdit2 />}>
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
                {imagePreview || profileImage ? (
                  <img src={imagePreview || profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="w-12 h-12 text-gray-400" />
                )}
              </div>
              {isEditing && (
                <>
                  <label className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full cursor-pointer hover:bg-primary-600 transition-colors shadow-lg">
                    <FiCamera className="w-4 h-4" />
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {(imagePreview || profileImage) && (
                    <button onClick={removeImage} className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
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
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} icon={<FiUpload />}>
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
                {isEditing && watchedFields[field.name] && (
                  <button onClick={() => copyToClipboard(field.name)}
                    className="absolute right-8 top-9 text-gray-400 hover:text-gray-600"
                    type="button" aria-label={`Copy ${field.label}`}>
                    <FiCopy className="w-4 h-4" />
                  </button>
                )}
                {watchedFields[field.name] && !errors[field.name] && (
                  <FiCheckCircle className="absolute right-2 top-9 text-green-500 w-4 h-4" />
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Professional Summary
              </label>
              {isEditing && (
                <Button variant="ghost" size="sm" onClick={generateSummarySuggestion} className="text-xs">
                  Generate Suggestion
                </Button>
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
                errors.summary ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none resize-none disabled:opacity-50 text-sm`}
              placeholder="Write a compelling summary of your professional background..."
            />
            <div className="flex justify-between mt-1">
              {errors.summary && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" />{errors.summary.message}
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
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Profile Preview" size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg">
            {(profileImage || imagePreview) && (
              <img src={profileImage || imagePreview} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
            )}
            <div>
              <h3 className="text-lg font-bold">{watchedFields.fullName || 'Your Name'}</h3>
              <p className="text-primary-600 dark:text-primary-400">{watchedFields.title || 'Professional Title'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {[
              { field: 'email', icon: FiMail, label: 'Email' },
              { field: 'phone', icon: FiPhone, label: 'Phone' },
              { field: 'location', icon: FiMapPin, label: 'Location' },
              { field: 'linkedin', icon: FiLinkedin, label: 'LinkedIn', isLink: true },
              { field: 'github', icon: FiGithub, label: 'GitHub', isLink: true },
            ].map(({ field, icon: Icon, label, isLink }) => (
              watchedFields[field] && (
                <div key={field} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-gray-400" />
                  {isLink ? (
                    <a href={watchedFields[field]} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                      {label} <FiExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-sm">{watchedFields[field]}</span>
                  )}
                </div>
              )
            ))}
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
