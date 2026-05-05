import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiCamera, FiLock,
  FiShield, FiBell, FiGlobe, FiBriefcase, FiLink, FiGithub,
  FiLinkedin, FiTwitter, FiTrash2, FiEdit2, FiCheckCircle,
  FiAlertCircle, FiAward, FiEye, FiEyeOff,
} from 'react-icons/fi';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import Modal from '../components/ui/Modal';
import Tooltip from '../components/ui/Tooltip';
import Avatar from '../components/ui/Avatar';
import { usePageTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// ── Sub-Components ────────────────────────────────────────────────────────

const ProfileTab = React.memo(({ register, errors, watchedFields, isDirty, loading, onSubmit }) => (
  <Card className="p-6">
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Full Name" icon={<FiUser />}
          {...register('displayName', { required: 'Name is required' })}
          error={errors.displayName?.message} />
        <Input label="Professional Title" icon={<FiBriefcase />}
          {...register('title')} placeholder="e.g., Senior Software Engineer" />
        <Input label="Email Address" icon={<FiMail />}
          {...register('email')} disabled
          helperText="Email changes require verification from the Account tab" />
        <Input label="Phone" icon={<FiPhone />} {...register('phone')} placeholder="+1 (555) 123-4567" />
        <Input label="Location" icon={<FiMapPin />} {...register('location')} placeholder="City, Country" />
        <Input label="Website" icon={<FiGlobe />} {...register('website')} placeholder="https://yourwebsite.com" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Bio</label>
        <textarea {...register('bio')} rows={4} maxLength={500}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm" />
        <p className="text-xs text-gray-500 mt-1">{watchedFields.bio?.length || 0}/500</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="GitHub" icon={<FiGithub />} {...register('github')} placeholder="github.com/username" />
        <Input label="LinkedIn" icon={<FiLinkedin />} {...register('linkedin')} placeholder="linkedin.com/in/username" />
        <Input label="Twitter" icon={<FiTwitter />} {...register('twitter')} placeholder="twitter.com/username" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={loading} disabled={!isDirty} icon={<FiSave />}>Save Changes</Button>
      </div>
    </form>
  </Card>
));

ProfileTab.displayName = 'ProfileTab';

const AccountTab = React.memo(({ user, userData, isEmailVerified, onResendVerification, onShowEmailModal, onShowPasswordModal, onShowDeleteModal }) => (
  <Card className="p-6 divide-y divide-gray-200 dark:divide-gray-700">
    <div className="py-4 first:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Email Address</h3>
          <p className="text-sm text-gray-500">{user?.email}</p>
          {!isEmailVerified && <p className="text-xs text-yellow-600 mt-1">Not verified</p>}
        </div>
        <div className="flex gap-2">
          {!isEmailVerified && <Button size="sm" variant="outline" onClick={onResendVerification}>Verify</Button>}
          <Button size="sm" variant="outline" onClick={onShowEmailModal}>Change</Button>
        </div>
      </div>
    </div>
    <div className="py-4">
      <div className="flex items-center justify-between">
        <div><h3 className="font-semibold">Password</h3><p className="text-sm text-gray-500">••••••••</p></div>
        <Button size="sm" variant="outline" onClick={onShowPasswordModal}>Change</Button>
      </div>
    </div>
    <div className="py-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Account Type</h3>
          <Badge variant={userData?.role === 'premium' ? 'warning' : 'secondary'} className="mt-1">
            {userData?.role === 'premium' ? 'Premium' : 'Free'}
          </Badge>
        </div>
        {userData?.role !== 'premium' && <Button size="sm" onClick={() => window.location.href = '/pricing'}>Upgrade</Button>}
      </div>
    </div>
    <div className="py-4">
      <div className="flex items-center justify-between">
        <div><h3 className="font-semibold text-red-600">Delete Account</h3><p className="text-sm text-gray-500">Permanently delete all data</p></div>
        <Button size="sm" variant="danger" onClick={onShowDeleteModal}>Delete</Button>
      </div>
    </div>
  </Card>
));

AccountTab.displayName = 'AccountTab';

const ConnectionsTab = React.memo(({ user, linkProvider, unlinkProvider }) => {
  const linkedProviders = user?.providerData?.map(p => p.providerId) || [];
  
  const providers = [
    { id: 'google.com', name: 'Google', icon: 'G' },
    { id: 'github.com', name: 'GitHub', icon: <FiGithub className="w-5 h-5" /> },
    { id: 'twitter.com', name: 'Twitter', icon: <FiTwitter className="w-5 h-5" /> },
  ];

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Connected Accounts</h3>
      <div className="space-y-3">
        {providers.map(p => {
          const connected = linkedProviders.includes(p.id);
          return (
            <div key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-semibold text-sm">
                  {typeof p.icon === 'string' ? p.icon : p.icon}
                </div>
                <span className="font-medium text-sm">{p.name}</span>
                {connected && <Badge variant="success" size="sm">Connected</Badge>}
              </div>
              {connected ? (
                <Button size="sm" variant="outline" onClick={() => unlinkProvider(p.id)}>Disconnect</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => linkProvider(p.name.toLowerCase())}>Connect</Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
});

ConnectionsTab.displayName = 'ConnectionsTab';

const ChangePasswordModal = React.memo(({ isOpen, onClose, updateUserPassword }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      toast.success('Password updated');
      onClose();
    } catch { toast.error('Failed to update password'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Current Password" type={showCurrent ? 'text' : 'password'} value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)} required
          rightIcon={<button type="button" onClick={() => setShowCurrent(!showCurrent)}>{showCurrent ? <FiEyeOff /> : <FiEye />}</button>} />
        <Input label="New Password" type={showNew ? 'text' : 'password'} value={newPassword}
          onChange={e => setNewPassword(e.target.value)} required
          rightIcon={<button type="button" onClick={() => setShowNew(!showNew)}>{showNew ? <FiEyeOff /> : <FiEye />}</button>} />
        <Input label="Confirm New Password" type="password" value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)} required />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Update</Button>
        </div>
      </form>
    </Modal>
  );
});

ChangePasswordModal.displayName = 'ChangePasswordModal';

const ChangeEmailModal = React.memo(({ isOpen, onClose, updateUserEmail, currentEmail }) => {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newEmail.includes('@')) { toast.error('Invalid email'); return; }
    setLoading(true);
    try {
      await updateUserEmail(newEmail, password);
      toast.success('Verification sent to new email');
      onClose();
    } catch { toast.error('Failed to update email'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Email">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm">Current: <strong>{currentEmail}</strong></p>
        </div>
        <Input label="New Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Update</Button>
        </div>
      </form>
    </Modal>
  );
});

ChangeEmailModal.displayName = 'ChangeEmailModal';

// ── Main Component ────────────────────────────────────────────────────────

const Profile = () => {
  const { user, userData, updateUserProfile, updateUserEmail, updateUserPassword, sendVerificationEmail, isEmailVerified, linkProvider, unlinkProvider } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [imagePreview, setImagePreview] = useState(user?.photoURL || null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const fileInputRef = useRef(null);

  usePageTitle({
    title: 'Profile Settings',
    description: 'Manage your account profile, security settings, and connected accounts.',
  });

  const { register, handleSubmit, formState: { errors, isDirty }, watch } = useForm({
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
      twitter: userData?.twitter || '',
    },
  });

  const watchedFields = watch();

  const profileCompletion = useMemo(() => {
    const fields = ['displayName', 'email', 'phone', 'location', 'bio', 'title'];
    const completed = fields.filter(f => watchedFields[f]?.trim()).length;
    return Math.round((completed / fields.length) * 100);
  }, [watchedFields]);

  const onSubmit = useCallback(async (data) => {
    setLoading(true);
    try {
      await updateUserProfile({ ...data, photoURL: imagePreview });
      toast.success('Profile updated');
    } catch { toast.error('Failed to update'); }
    finally { setLoading(false); }
  }, [updateUserProfile, imagePreview]);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large (max 5MB)'); return; }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    toast.success('Image updated (local preview)');
  }, []);

  const handleRemoveImage = useCallback(async () => {
    try {
      await updateUserProfile({ photoURL: null });
      setImagePreview(null);
      toast.success('Photo removed');
    } catch { toast.error('Failed to remove'); }
  }, [updateUserProfile]);

  const handleResendVerification = useCallback(async () => {
    try {
      await sendVerificationEmail();
      toast.success('Verification email sent!');
    } catch { toast.error('Failed to send'); }
  }, [sendVerificationEmail]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'account', label: 'Account', icon: FiShield },
    { id: 'connections', label: 'Connections', icon: FiLink },
  ];

  return (
    <DashboardLayout title="Profile Settings" showWelcome={false}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar src={imagePreview} name={user?.displayName} size="xl" className="w-24 h-24 sm:w-28 sm:h-28" />
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 shadow-lg">
                <FiCamera className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {imagePreview && user?.photoURL !== imagePreview && (
                <button onClick={handleRemoveImage} className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full">
                  <FiTrash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{user?.displayName || 'User'}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                {isEmailVerified ? <Badge variant="success"><FiCheckCircle className="w-3 h-3 mr-1" />Verified</Badge> : <Badge variant="warning"><FiAlertCircle className="w-3 h-3 mr-1" />Not Verified</Badge>}
                {userData?.role === 'premium' && <Badge variant="warning"><FiAward className="w-3 h-3 mr-1" />PRO</Badge>}
              </div>
              <div className="mt-4 max-w-xs">
                <div className="flex justify-between text-xs mb-1"><span>Profile Completion</span><span>{profileCompletion}%</span></div>
                <Progress value={profileCompletion} size="sm" />
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${
                activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <tab.icon className="w-4 h-4" /><span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ProfileTab register={register} errors={errors} watchedFields={watchedFields} isDirty={isDirty} loading={loading} onSubmit={handleSubmit(onSubmit)} />
            </motion.div>
          )}
          {activeTab === 'account' && (
            <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AccountTab user={user} userData={userData} isEmailVerified={isEmailVerified}
                onResendVerification={handleResendVerification}
                onShowEmailModal={() => setShowEmailModal(true)}
                onShowPasswordModal={() => setShowPasswordModal(true)}
                onShowDeleteModal={() => toast.error('Contact support to delete account')} />
            </motion.div>
          )}
          {activeTab === 'connections' && (
            <motion.div key="connections" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ConnectionsTab user={user} linkProvider={linkProvider} unlinkProvider={unlinkProvider} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} updateUserPassword={updateUserPassword} />
      <ChangeEmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} updateUserEmail={updateUserEmail} currentEmail={user?.email} />
    </DashboardLayout>
  );
};

export default Profile;
