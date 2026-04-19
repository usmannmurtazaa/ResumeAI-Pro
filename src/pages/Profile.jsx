import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiSave,
  FiCamera,
  FiLock,
  FiShield,
  FiBell,
  FiGlobe,
  FiBriefcase,
  FiLink,
  FiGithub,
  FiLinkedin,
  FiTwitter,
  FiUpload,
  FiTrash2,
  FiEdit2,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiMoon,
  FiSun,
  FiCalendar,
  FiActivity,
  FiAward,
  FiKey,
  FiEye,
  FiEyeOff,
  FiChevronRight
} from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import Modal from '../components/ui/Modal';
import Tooltip from '../components/ui/Tooltip';
import Avatar from '../components/ui/Avatar';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, userData, updateUserProfile, updateUserEmail, updateUserPassword, sendVerificationEmail, isEmailVerified, linkProvider, unlinkProvider } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.photoURL || null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, formState: { errors, isDirty }, reset, watch } = useForm({
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || '',
      phone: userData?.phone || '',
      location: userData?.location || '',
      bio: userData?.bio || '',
      title: userData?.title || '',
      website: userData?.website || '',
      github: userData?.github || '',
      linkedin: userData?.linkedin || '',
      twitter: userData?.twitter || ''
    }
  });

  const watchedFields = watch();

  // Calculate profile completion
  const profileCompletion = React.useMemo(() => {
    const fields = ['displayName', 'email', 'phone', 'location', 'bio', 'title'];
    const completed = fields.filter(field => watchedFields[field]?.trim()).length;
    return Math.round((completed / fields.length) * 100);
  }, [watchedFields]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await updateUserProfile({
        ...data,
        photoURL: imagePreview
      });
      toast.success('Profile updated successfully');
      reset(data);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
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

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to storage
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const url = await storageService.uploadProfileImage(user.uid, file, (progress) => {
        setUploadProgress(progress);
      });
      
      await updateUserProfile({ photoURL: url });
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error('Failed to upload image');
      setImagePreview(user?.photoURL);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = async () => {
    try {
      await updateUserProfile({ photoURL: null });
      setImagePreview(null);
      toast.success('Profile picture removed');
    } catch (error) {
      toast.error('Failed to remove profile picture');
    }
  };

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      toast.success('Verification email sent! Check your inbox');
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'account', label: 'Account', icon: FiShield },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'connections', label: 'Connections', icon: FiLink }
  ];

  return (
    <DashboardLayout title="Profile Settings" description="Manage your account and profile information">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar Section */}
              <div className="relative">
                <div className="relative group">
                  <Avatar 
                    src={imagePreview} 
                    name={user?.displayName} 
                    size="xl" 
                    className="w-24 h-24 sm:w-28 sm:h-28"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors shadow-lg"
                    disabled={isUploading}
                  >
                    <FiCamera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {imagePreview && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                )}
                {isUploading && (
                  <div className="mt-2">
                    <Progress value={uploadProgress} size="sm" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold">{user?.displayName || 'User'}</h2>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  {isEmailVerified ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3" />
                      Email Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      Email Not Verified
                    </Badge>
                  )}
                  {userData?.role === 'premium' && (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <FiAward className="w-3 h-3" />
                      PRO Member
                    </Badge>
                  )}
                </div>

                {/* Profile Completion */}
                <div className="mt-4 max-w-xs">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Profile Completion</span>
                    <span>{profileCompletion}%</span>
                  </div>
                  <Progress value={profileCompletion} size="sm" />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Tooltip content="Edit Profile">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('profile')}
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </Button>
                </Tooltip>
                {!isEmailVerified && (
                  <Button
                    size="sm"
                    onClick={handleResendVerification}
                  >
                    Verify Email
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ProfileTab 
                register={register}
                errors={errors}
                watchedFields={watchedFields}
                isDirty={isDirty}
                loading={loading}
                onSubmit={handleSubmit(onSubmit)}
              />
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AccountTab 
                user={user}
                userData={userData}
                isEmailVerified={isEmailVerified}
                onResendVerification={handleResendVerification}
                onShowEmailModal={() => setShowEmailModal(true)}
                onShowPasswordModal={() => setShowPasswordModal(true)}
                onShowDeleteModal={() => setShowDeleteModal(true)}
              />
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <NotificationsTab />
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SecurityTab />
            </motion.div>
          )}

          {activeTab === 'connections' && (
            <motion.div
              key="connections"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ConnectionsTab 
                userData={userData}
                linkProvider={linkProvider}
                unlinkProvider={unlinkProvider}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <ChangePasswordModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        updateUserPassword={updateUserPassword}
      />
      
      <ChangeEmailModal 
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        updateUserEmail={updateUserEmail}
        currentEmail={user?.email}
      />
    </DashboardLayout>
  );
};

// Profile Tab Component
const ProfileTab = ({ register, errors, watchedFields, isDirty, loading, onSubmit }) => (
  <Card className="p-6">
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Full Name"
          icon={<FiUser />}
          {...register('displayName', { required: 'Name is required' })}
          error={errors.displayName?.message}
        />
        
        <Input
          label="Professional Title"
          icon={<FiBriefcase />}
          {...register('title')}
          placeholder="e.g., Senior Software Engineer"
        />
        
        <Input
          label="Email"
          icon={<FiMail />}
          {...register('email', { 
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email'
            }
          })}
          error={errors.email?.message}
          disabled
        />
        
        <Input
          label="Phone"
          icon={<FiPhone />}
          {...register('phone')}
          placeholder="+1 (555) 123-4567"
        />
        
        <Input
          label="Location"
          icon={<FiMapPin />}
          {...register('location')}
          placeholder="City, Country"
        />
        
        <Input
          label="Website"
          icon={<FiGlobe />}
          {...register('website')}
          placeholder="https://yourwebsite.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Bio</label>
        <textarea
          {...register('bio')}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
          placeholder="Tell us about yourself..."
        />
        <p className="text-xs text-gray-500 mt-1">
          {watchedFields.bio?.length || 0}/500 characters
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="GitHub"
          icon={<FiGithub />}
          {...register('github')}
          placeholder="github.com/username"
        />
        <Input
          label="LinkedIn"
          icon={<FiLinkedin />}
          {...register('linkedin')}
          placeholder="linkedin.com/in/username"
        />
        <Input
          label="Twitter"
          icon={<FiTwitter />}
          {...register('twitter')}
          placeholder="twitter.com/username"
        />
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          loading={loading} 
          disabled={!isDirty}
          icon={<FiSave />}
        >
          Save Changes
        </Button>
      </div>
    </form>
  </Card>
);

// Account Tab Component
const AccountTab = ({ user, userData, isEmailVerified, onResendVerification, onShowEmailModal, onShowPasswordModal, onShowDeleteModal }) => (
  <Card className="p-6 divide-y divide-gray-200 dark:divide-gray-700">
    <div className="py-4 first:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Email Address</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
          {!isEmailVerified && (
            <p className="text-xs text-yellow-600 mt-1">Email not verified</p>
          )}
        </div>
        <div className="flex gap-2">
          {!isEmailVerified && (
            <Button size="sm" variant="outline" onClick={onResendVerification}>
              Verify
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onShowEmailModal}>
            Change
          </Button>
        </div>
      </div>
    </div>

    <div className="py-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Password</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">••••••••</p>
          <p className="text-xs text-gray-500 mt-1">Last changed: Never</p>
        </div>
        <Button size="sm" variant="outline" onClick={onShowPasswordModal}>
          Change
        </Button>
      </div>
    </div>

    <div className="py-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Account Type</h3>
          <Badge variant={userData?.role === 'premium' ? 'warning' : 'secondary'} className="mt-1">
            {userData?.role === 'premium' ? 'Premium Member' : 'Free Member'}
          </Badge>
        </div>
        {userData?.role !== 'premium' && (
          <Button size="sm" onClick={() => window.location.href = '/pricing'}>
            Upgrade
          </Button>
        )}
      </div>
    </div>

    <div className="py-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-red-600">Delete Account</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Permanently delete your account and all data
          </p>
        </div>
        <Button size="sm" variant="danger" onClick={onShowDeleteModal}>
          Delete
        </Button>
      </div>
    </div>
  </Card>
);

// Notifications Tab Component
const NotificationsTab = () => {
  const [settings, setSettings] = useState({
    emailResumeUpdates: true,
    emailMarketing: false,
    emailSecurity: true,
    pushNewFeatures: true,
    pushATSAlerts: true
  });

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Notification Preferences</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Resume Updates</p>
            <p className="text-sm text-gray-500">Get notified when your resume is downloaded</p>
          </div>
          <input type="checkbox" checked={settings.emailResumeUpdates} onChange={() => {}} className="toggle" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Marketing Emails</p>
            <p className="text-sm text-gray-500">Receive tips and special offers</p>
          </div>
          <input type="checkbox" checked={settings.emailMarketing} onChange={() => {}} className="toggle" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Security Alerts</p>
            <p className="text-sm text-gray-500">Get notified about account security events</p>
          </div>
          <input type="checkbox" checked={settings.emailSecurity} onChange={() => {}} className="toggle" />
        </div>
      </div>
    </Card>
  );
};

// Security Tab Component
const SecurityTab = () => (
  <Card className="p-6 space-y-4">
    <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Authenticator App</p>
        <p className="text-sm text-gray-500">Use an authenticator app for 2FA</p>
      </div>
      <Button size="sm" variant="outline">Setup</Button>
    </div>
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">SMS Authentication</p>
        <p className="text-sm text-gray-500">Receive codes via SMS</p>
      </div>
      <Button size="sm" variant="outline">Setup</Button>
    </div>

    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold mb-4">Active Sessions</h3>
      <div className="space-y-3">
        <SessionItem device="MacBook Pro" location="San Francisco, CA" current={true} />
        <SessionItem device="iPhone 15 Pro" location="San Francisco, CA" current={false} />
      </div>
    </div>
  </Card>
);

// Session Item Component
const SessionItem = ({ device, location, current }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium">{device}</p>
      <p className="text-sm text-gray-500">{location}</p>
    </div>
    {current ? (
      <Badge variant="success" size="sm">Current</Badge>
    ) : (
      <Button size="sm" variant="ghost" className="text-red-500">Revoke</Button>
    )}
  </div>
);

// Connections Tab Component
const ConnectionsTab = ({ userData, linkProvider, unlinkProvider }) => {
  const providers = [
    { id: 'google.com', name: 'Google', icon: 'G', connected: !!userData?.providerData?.find(p => p.providerId === 'google.com') },
    { id: 'github.com', name: 'GitHub', icon: <FiGithub />, connected: !!userData?.providerData?.find(p => p.providerId === 'github.com') },
    { id: 'twitter.com', name: 'Twitter', icon: <FiTwitter />, connected: !!userData?.providerData?.find(p => p.providerId === 'twitter.com') }
  ];

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Connected Accounts</h3>
      <div className="space-y-3">
        {providers.map(provider => (
          <div key={provider.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {typeof provider.icon === 'string' ? provider.icon : <provider.icon className="w-5 h-5" />}
              </div>
              <span className="font-medium">{provider.name}</span>
            </div>
            {provider.connected ? (
              <Button size="sm" variant="outline" onClick={() => unlinkProvider(provider.id)}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => linkProvider(provider.name.toLowerCase())}>
                Connect
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

// Change Password Modal
const ChangePasswordModal = ({ isOpen, onClose, updateUserPassword }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      toast.success('Password updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Current Password"
          type={showCurrent ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          rightIcon={
            <button type="button" onClick={() => setShowCurrent(!showCurrent)}>
              {showCurrent ? <FiEyeOff /> : <FiEye />}
            </button>
          }
        />
        <Input
          label="New Password"
          type={showNew ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          rightIcon={
            <button type="button" onClick={() => setShowNew(!showNew)}>
              {showNew ? <FiEyeOff /> : <FiEye />}
            </button>
          }
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Update Password</Button>
        </div>
      </form>
    </Modal>
  );
};

// Change Email Modal
const ChangeEmailModal = ({ isOpen, onClose, updateUserEmail, currentEmail }) => {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserEmail(newEmail, password);
      toast.success('Verification email sent to new address');
      onClose();
    } catch (error) {
      toast.error('Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Email Address">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Current email: <strong>{currentEmail}</strong>
          </p>
        </div>
        <Input
          label="New Email Address"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Update Email</Button>
        </div>
      </form>
    </Modal>
  );
};

export default Profile;