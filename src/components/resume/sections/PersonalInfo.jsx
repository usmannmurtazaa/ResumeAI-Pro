import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiInfo,
  FiUpload,
  FiCamera,
  FiX,
  FiExternalLink,
  FiBriefcase,
  FiCalendar,
  FiAward,
  FiSave,
  FiEdit2,
  FiCopy
} from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Progress from '../../ui/Progress';
import Tooltip from '../../ui/Tooltip';
import Card from '../../ui/Card';
import Modal from '../../ui/Modal';
import toast from 'react-hot-toast';
import { debounce } from 'lodash';

const PersonalInfo = ({ data = {}, onChange, onValidationChange }) => {
  const [isEditing, setIsEditing] = useState(true);
  const [profileImage, setProfileImage] = useState(data.profileImage || null);
  const [imagePreview, setImagePreview] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [validationErrors, setValidationErrors] = useState({});

  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue,
    formState: { errors, isValid, isDirty },
    trigger,
    reset
  } = useForm({
    defaultValues: {
      fullName: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
      summary: '',
      ...data
    },
    mode: 'onChange'
  });

  // Watch all fields for real-time updates
  const watchedFields = watch();

  // Calculate completion percentage
  useEffect(() => {
    calculateCompletion();
  }, [watchedFields]);

  // Auto-save functionality
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
    const fields = [
      'fullName', 'title', 'email', 'phone', 'location', 
      'summary', 'linkedin', 'github'
    ];
    const filled = fields.filter(field => watchedFields[field]?.trim()).length;
    const percentage = Math.round((filled / fields.length) * 100);
    setCompletionPercentage(percentage);
    
    // Notify parent of validation status
    onValidationChange?.({
      isValid,
      completionPercentage: percentage,
      errors: Object.keys(errors).length
    });
  };

  const handleSave = async (formData) => {
    try {
      // Validate before saving
      const isValid = await trigger();
      if (!isValid) {
        setAutoSaveStatus('error');
        return;
      }

      const dataToSave = {
        ...formData,
        profileImage,
        lastUpdated: new Date().toISOString()
      };
      
      onChange?.(dataToSave);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setAutoSaveStatus('error');
    }
  };

  const handleManualSave = async () => {
    const isValid = await trigger();
    if (isValid) {
      await handleSave(watchedFields);
      toast.success('Personal information saved successfully!');
    } else {
      toast.error('Please fix validation errors before saving');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
      setImagePreview(reader.result);
      setValue('profileImage', reader.result);
      toast.success('Profile image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    setValue('profileImage', null);
  };

  const validateLinkedIn = (url) => {
    if (!url) return true;
    return url.includes('linkedin.com/in/') || 'Please enter a valid LinkedIn profile URL';
  };

  const validateGitHub = (url) => {
    if (!url) return true;
    return url.includes('github.com/') || 'Please enter a valid GitHub profile URL';
  };

  const validatePhone = (phone) => {
    if (!phone) return true;
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone) || 'Please enter a valid phone number';
  };

  const generateSummarySuggestion = () => {
    const { fullName, title } = watchedFields;
    if (fullName && title) {
      const suggestion = `${fullName} is a dedicated ${title} with a proven track record of delivering high-quality results. Passionate about innovation and continuous improvement, with strong problem-solving abilities and excellent communication skills.`;
      setValue('summary', suggestion);
      toast.success('Summary suggestion generated!');
    } else {
      toast.error('Please enter your name and title first');
    }
  };

  const copyToClipboard = (field) => {
    navigator.clipboard?.writeText(watchedFields[field]);
    toast.success(`${field} copied to clipboard!`);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const fields = [
    {
      name: 'fullName',
      label: 'Full Name',
      icon: <FiUser />,
      required: true,
      placeholder: 'John Doe',
      validation: { required: 'Full name is required' }
    },
    {
      name: 'title',
      label: 'Professional Title',
      icon: <FiBriefcase />,
      required: true,
      placeholder: 'Senior Software Engineer',
      validation: { required: 'Professional title is required' }
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      icon: <FiMail />,
      required: true,
      placeholder: 'john.doe@example.com',
      validation: {
        required: 'Email is required',
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: 'Invalid email address'
        }
      }
    },
    {
      name: 'phone',
      label: 'Phone Number',
      icon: <FiPhone />,
      required: true,
      placeholder: '+1 (555) 123-4567',
      validation: {
        required: 'Phone number is required',
        validate: validatePhone
      }
    },
    {
      name: 'location',
      label: 'Location',
      icon: <FiMapPin />,
      placeholder: 'San Francisco, CA',
      validation: {}
    },
    {
      name: 'website',
      label: 'Website/Portfolio',
      icon: <FiGlobe />,
      placeholder: 'https://johndoe.com',
      validation: {
        pattern: {
          value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
          message: 'Invalid URL'
        }
      }
    },
    {
      name: 'linkedin',
      label: 'LinkedIn Profile',
      icon: <FiLinkedin />,
      placeholder: 'linkedin.com/in/johndoe',
      validation: {
        validate: validateLinkedIn
      }
    },
    {
      name: 'github',
      label: 'GitHub Profile',
      icon: <FiGithub />,
      placeholder: 'github.com/johndoe',
      validation: {
        validate: validateGitHub
      }
    }
  ];

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Progress and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">Personal Information</h3>
            {completionPercentage === 100 && (
              <Badge variant="success" className="flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" />
                Complete
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xs">
              <Progress 
                value={completionPercentage} 
                size="sm" 
                showPercentage
              />
            </div>
            <div className="flex items-center gap-2">
              {autoSaveStatus === 'saving' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
              {autoSaveStatus === 'saved' && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <FiCheckCircle className="w-3 h-3" />
                  Saved
                </span>
              )}
              {autoSaveStatus === 'error' && (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" />
                  Error saving
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            icon={<FiEye />}
          >
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            icon={<FiEdit2 />}
          >
            {isEditing ? 'View Mode' : 'Edit Mode'}
          </Button>
          <Button
            size="sm"
            onClick={handleManualSave}
            loading={autoSaveStatus === 'saving'}
            icon={<FiSave />}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Profile Image Upload */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Image Preview */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-4 border-primary-100 dark:border-primary-900">
                {imagePreview || profileImage ? (
                  <img 
                    src={imagePreview || profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser className="w-12 h-12 text-gray-400" />
                )}
              </div>
              
              {isEditing && (
                <>
                  <label className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full cursor-pointer hover:bg-primary-600 transition-colors shadow-lg">
                    <FiCamera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  
                  {(imagePreview || profileImage) && (
                    <button
                      onClick={removeImage}
                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
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
              <div className="flex gap-2 justify-center sm:justify-start">
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.querySelector('input[type="file"]')?.click()}
                    icon={<FiUpload />}
                  >
                    Upload Photo
                  </Button>
                )}
                <Tooltip content="Profile photos are optional but can increase response rates by 30%">
                  <FiInfo className="w-4 h-4 text-gray-400" />
                </Tooltip>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Form Fields */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field, index) => (
                <motion.div
                  key={field.name}
                  variants={itemVariants}
                  custom={index}
                  className={field.name === 'website' ? 'md:col-span-2' : ''}
                >
                  <div className="relative">
                    <Input
                      label={field.label}
                      type={field.type || 'text'}
                      icon={field.icon}
                      placeholder={field.placeholder}
                      disabled={!isEditing}
                      {...register(field.name, field.validation)}
                      error={errors[field.name]?.message}
                      className="pr-20"
                    />
                    
                    {isEditing && watchedFields[field.name] && (
                      <button
                        onClick={() => copyToClipboard(field.name)}
                        className="absolute right-10 top-9 text-gray-400 hover:text-gray-600"
                        title="Copy to clipboard"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                    )}
                    
                    {watchedFields[field.name] && !errors[field.name] && (
                      <FiCheckCircle className="absolute right-3 top-9 text-green-500" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Professional Summary */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Professional Summary
                </label>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateSummarySuggestion}
                    className="text-xs"
                  >
                    Generate Suggestion
                  </Button>
                )}
              </div>
              
              <div className="relative">
                <textarea
                  {...register('summary', {
                    minLength: {
                      value: 50,
                      message: 'Summary should be at least 50 characters'
                    },
                    maxLength: {
                      value: 500,
                      message: 'Summary should not exceed 500 characters'
                    }
                  })}
                  rows={4}
                  disabled={!isEditing}
                  className={`
                    w-full px-4 py-3 rounded-xl border 
                    ${errors.summary 
                      ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500'
                    }
                    bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm 
                    focus:ring-2 focus:border-transparent outline-none 
                    transition-all duration-200 resize-none
                    ${!isEditing && 'bg-gray-50 dark:bg-gray-900'}
                  `}
                  placeholder="Write a compelling summary of your professional background, key achievements, and career objectives..."
                />
                
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {watchedFields.summary?.length || 0}/500
                </div>
              </div>
              
              {errors.summary && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" />
                  {errors.summary.message}
                </p>
              )}
            </motion.div>

            {/* Quick Stats */}
            {watchedFields.fullName && watchedFields.title && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                  <FiAward className="w-4 h-4" />
                  Profile Strength
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium">{watchedFields.fullName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Title</p>
                    <p className="font-medium">{watchedFields.title}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Contact</p>
                    <p className="font-medium">
                      {watchedFields.email && '✓'} {watchedFields.phone && '✓'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Social</p>
                    <p className="font-medium">
                      {watchedFields.linkedin && '✓'} {watchedFields.github && '✓'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </form>
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
          {/* Profile Header */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg">
            {(profileImage || imagePreview) && (
              <img 
                src={profileImage || imagePreview} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="text-lg font-bold">{watchedFields.fullName || 'Your Name'}</h3>
              <p className="text-primary-600 dark:text-primary-400">{watchedFields.title || 'Professional Title'}</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3 p-4">
            {watchedFields.email && (
              <div className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{watchedFields.email}</span>
              </div>
            )}
            {watchedFields.phone && (
              <div className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{watchedFields.phone}</span>
              </div>
            )}
            {watchedFields.location && (
              <div className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{watchedFields.location}</span>
              </div>
            )}
            {watchedFields.linkedin && (
              <div className="flex items-center gap-2">
                <FiLinkedin className="w-4 h-4 text-blue-500" />
                <a 
                  href={watchedFields.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                >
                  LinkedIn <FiExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Summary */}
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

// Eye icon component for preview
const FiEye = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export default React.memo(PersonalInfo);