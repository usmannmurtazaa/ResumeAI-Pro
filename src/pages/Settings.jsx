import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Switch from '../components/ui/Switch';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import {
  FiBell,
  FiLock,
  FiGlobe,
  FiMoon,
  FiSave,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiDownload,
  FiRefreshCw,
  FiLogOut,
  FiMonitor,
  FiSmartphone,
  FiDatabase,
  FiVolume2,
  FiVolumeX,
  FiWifi,
  FiWifiOff,
  FiHardDrive,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { usePageTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'notifications', label: 'Notifications', icon: FiBell },
  { id: 'security', label: 'Security', icon: FiLock },
  { id: 'preferences', label: 'Preferences', icon: FiGlobe },
  { id: 'data', label: 'Data & Storage', icon: FiDatabase },
];

const SESSION_TIMEOUTS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'Europe/London', label: 'London' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const TEMPLATES = [
  { value: 'modern', label: 'Modern Professional' },
  { value: 'classic', label: 'Classic Executive' },
  { value: 'creative', label: 'Creative Portfolio' },
  { value: 'minimal', label: 'Minimalist' },
];

const AUTO_SAVE_INTERVALS = [
  { value: '10', label: '10 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '60 seconds' },
];

// ── Sub-Components ────────────────────────────────────────────────────────

const SettingToggle = React.memo(({ title, description, checked, onChange, icon: Icon }) => (
  <div className="flex items-center justify-between py-1">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" />}
      <div>
        <p className="font-medium text-sm">{title}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
    <Switch checked={checked} onChange={onChange} />
  </div>
));

SettingToggle.displayName = 'SettingToggle';

const SettingSelect = React.memo(({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
));

SettingSelect.displayName = 'SettingSelect';

// ── Main Component ────────────────────────────────────────────────────────

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout, updateUserPassword, updateUserProfile, deleteAccount } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  usePageTitle({
    title: 'Settings',
    description: 'Manage your account preferences, notifications, security settings, and data.',
  });

  const [activeTab, setActiveTab] = useState('notifications');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePartial, setDeletePartial] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    resumeUpdates: true,
    atsScoreAlerts: true,
    marketingEmails: false,
    weeklyDigest: true,
    securityAlerts: true,
    soundEnabled: true,
    sessionTimeout: '30',
    loginAlerts: true,
    autoSave: true,
    autoSaveInterval: '30',
    defaultTemplate: 'modern',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    compactMode: false,
    reducedMotion: false,
    highContrast: false,
    showEmail: false,
    showPhone: false,
    showLocation: false,
    dataCollection: true,
    cacheEnabled: true,
    offlineMode: true,
    autoDownload: false,
    compressImages: true,
  });

  // Sessions (mock data)
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: 'MacBook Pro',
      browser: 'Chrome',
      location: 'Karachi, Sindh | PK',
      lastActive: 'Now',
      current: true,
    },
    {
      id: 2,
      device: 'iPhone 15 Pro',
      browser: 'Safari',
      location: 'Karachi, Sindh | PK',
      lastActive: '2 hours ago',
      current: false,
    },
  ]);

  // Whether the signed-in user has a password provider. Used to decide
  // whether the delete-account modal must collect a password - OAuth-only
  // accounts do not have one and cannot reauthenticate with it.
  const userHasPassword = Boolean(
    user?.providerData?.some((p) => p.providerId === 'password')
  );

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleSettingChange = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleChangePassword = useCallback(async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await updateUserPassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password updated!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  }, [passwordForm, updateUserPassword]);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    setDeletePassword('');
    setDeletePartial(false);
    setIsDeleting(false);
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== user?.email) {
      toast.error('Please type your email to confirm');
      return;
    }

    if (userHasPassword && !deletePassword) {
      toast.error('Please enter your password to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount(userHasPassword ? deletePassword : undefined);
      toast.success('Account deleted');
      navigate('/');
    } catch (error) {
      // A partial failure means the Firestore cleanup succeeded but the
      // Firebase Auth deletion did not. The user's data is permanently
      // gone, but their Auth account still exists. Switch to the retry
      // view - the service is idempotent, so retrying skips the cleanup
      // and only re-attempts the Auth deletion.
      if (error?.partial) {
        setDeletePartial(true);
      }
      // For non-partial failures, AuthContext has already shown a
      // specific error toast; we just leave the modal open so the user
      // can try again or cancel.
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmText, deletePassword, userHasPassword, user, deleteAccount, navigate]);

  const handleRetryDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteAccount(userHasPassword ? deletePassword : undefined);
      toast.success('Account deleted');
      navigate('/');
    } catch (error) {
      // Stay in the partial state - the user's Firestore data is gone
      // regardless of what happens on this retry. If the error is not
      // marked partial, AuthContext has already toasted it, but we still
      // want the retry UI visible because the user cannot recover their
      // deleted data through any other path.
      if (!error?.partial) {
        setDeletePartial(true);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deletePassword, userHasPassword, deleteAccount, navigate]);

  const handleRevokeSession = useCallback((id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success('Session revoked');
  }, []);

  const handleExportData = useCallback(() => {
    const data = { profile: user, settings, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumeai-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported!');
  }, [user, settings]);

  return (
    <DashboardLayout title="Settings" showWelcome={false}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-text">Settings</h1>
              <p className="text-gray-500 text-sm">Manage your preferences</p>
            </div>
            <Button onClick={handleSave} loading={isSaving} icon={<FiSave />}>
              Save
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {activeTab === 'notifications' && (
              <Card className="p-6 space-y-6">
                <h3 className="text-lg font-semibold">Email Notifications</h3>
                <div className="space-y-3">
                  <SettingToggle
                    title="Email Notifications"
                    description="Updates about your account"
                    checked={settings.emailNotifications}
                    onChange={(v) => handleSettingChange('emailNotifications', v)}
                  />
                  <SettingToggle
                    title="Resume Updates"
                    description="When your resume is downloaded"
                    checked={settings.resumeUpdates}
                    onChange={(v) => handleSettingChange('resumeUpdates', v)}
                  />
                  <SettingToggle
                    title="ATS Score Alerts"
                    description="When your ATS score changes"
                    checked={settings.atsScoreAlerts}
                    onChange={(v) => handleSettingChange('atsScoreAlerts', v)}
                  />
                  <SettingToggle
                    title="Weekly Digest"
                    description="Weekly performance summary"
                    checked={settings.weeklyDigest}
                    onChange={(v) => handleSettingChange('weeklyDigest', v)}
                  />
                  <SettingToggle
                    title="Marketing Emails"
                    description="Tips and offers"
                    checked={settings.marketingEmails}
                    onChange={(v) => handleSettingChange('marketingEmails', v)}
                  />
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <h3 className="text-lg font-semibold">Push Notifications</h3>
                <div className="space-y-3">
                  <SettingToggle
                    title="Push Notifications"
                    checked={settings.pushNotifications}
                    onChange={(v) => handleSettingChange('pushNotifications', v)}
                  />
                  <SettingToggle
                    title="Security Alerts"
                    checked={settings.securityAlerts}
                    onChange={(v) => handleSettingChange('securityAlerts', v)}
                  />
                  <SettingToggle
                    title="Sound"
                    checked={settings.soundEnabled}
                    onChange={(v) => handleSettingChange('soundEnabled', v)}
                    icon={settings.soundEnabled ? FiVolume2 : FiVolumeX}
                  />
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Change Password</h3>
                  <Input
                    label="Current Password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    }
                  />
                  <Input
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    rightIcon={
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    }
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                  />
                  <Button onClick={handleChangePassword} loading={changingPassword}>
                    Update Password
                  </Button>
                </Card>

                <Card className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Session Timeout</h3>
                  <SettingSelect
                    label="Session Timeout"
                    value={settings.sessionTimeout}
                    onChange={(v) => handleSettingChange('sessionTimeout', v)}
                    options={SESSION_TIMEOUTS}
                  />
                  <SettingToggle
                    title="Login Alerts"
                    description="Get notified of new sign-ins"
                    checked={settings.loginAlerts}
                    onChange={(v) => handleSettingChange('loginAlerts', v)}
                  />
                </Card>

                <Card className="p-6 space-y-3">
                  <h3 className="text-lg font-semibold">Active Sessions</h3>
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {s.device.includes('Mac') ? (
                          <FiMonitor className="w-5 h-5" />
                        ) : (
                          <FiSmartphone className="w-5 h-5" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {s.device} • {s.browser}
                          </p>
                          <p className="text-xs text-gray-500">{s.location}</p>
                        </div>
                      </div>
                      {s.current ? (
                        <Badge variant="success" size="sm">
                          Current
                        </Badge>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleRevokeSession(s.id)}>
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-2" size="sm">
                    <FiLogOut className="w-4 h-4 mr-2" />
                    Sign Out All Others
                  </Button>
                </Card>

                <Card className="p-6 border-red-200 dark:border-red-800">
                  <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Permanently delete your account and all data
                  </p>
                  <Button
                    variant="danger"
                    onClick={() => setShowDeleteModal(true)}
                    icon={<FiTrash2 />}
                  >
                    Delete Account
                  </Button>
                </Card>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <Card className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Appearance</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiMoon className="w-5 h-5" />
                      <span className="font-medium text-sm">Dark Mode</span>
                    </div>
                    <Switch checked={isDark} onChange={toggleTheme} />
                  </div>
                  <SettingToggle
                    title="Compact Mode"
                    checked={settings.compactMode}
                    onChange={(v) => handleSettingChange('compactMode', v)}
                  />
                  <SettingToggle
                    title="Reduced Motion"
                    checked={settings.reducedMotion}
                    onChange={(v) => handleSettingChange('reducedMotion', v)}
                  />
                </Card>
                <Card className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Editor</h3>
                  <SettingToggle
                    title="Auto-save"
                    checked={settings.autoSave}
                    onChange={(v) => handleSettingChange('autoSave', v)}
                  />
                  <SettingSelect
                    label="Default Template"
                    value={settings.defaultTemplate}
                    onChange={(v) => handleSettingChange('defaultTemplate', v)}
                    options={TEMPLATES}
                  />
                </Card>
                <Card className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Regional</h3>
                  <SettingSelect
                    label="Language"
                    value={settings.language}
                    onChange={(v) => handleSettingChange('language', v)}
                    options={LANGUAGES}
                  />
                  <SettingSelect
                    label="Date Format"
                    value={settings.dateFormat}
                    onChange={(v) => handleSettingChange('dateFormat', v)}
                    options={DATE_FORMATS}
                  />
                </Card>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <Card className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Storage</h3>
                  <SettingToggle
                    title="Cache"
                    checked={settings.cacheEnabled}
                    onChange={(v) => handleSettingChange('cacheEnabled', v)}
                    icon={FiHardDrive}
                  />
                  <SettingToggle
                    title="Offline Mode"
                    checked={settings.offlineMode}
                    onChange={(v) => handleSettingChange('offlineMode', v)}
                    icon={settings.offlineMode ? FiWifi : FiWifiOff}
                  />
                  <SettingToggle
                    title="Auto Download"
                    checked={settings.autoDownload}
                    onChange={(v) => handleSettingChange('autoDownload', v)}
                  />
                </Card>
                <Card className="p-6 space-y-3">
                  <h3 className="text-lg font-semibold">Data Management</h3>
                  <Button
                    onClick={handleExportData}
                    variant="outline"
                    className="w-full"
                    icon={<FiDownload />}
                  >
                    Export Data
                  </Button>
                  <Button variant="outline" className="w-full" icon={<FiRefreshCw />}>
                    Clear Cache
                  </Button>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Delete Account Modal */}
      <Modal isOpen={showDeleteModal} onClose={closeDeleteModal} title="Delete Account">
        {deletePartial ? (
          // ── Partial-failure state ───────────────────────────────────
          // The Firestore cleanup succeeded, but the Firebase Auth
          // deletion did not (typically `auth/requires-recent-login`).
          // The user's data is already gone; only the account record
          // remains. Offer a retry that re-invokes the idempotent
          // service method.
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <FiAlertTriangle
                  className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Deletion partially completed
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Your resume data has been removed, but we couldn&apos;t finish closing your
                    account. Click Retry to complete the deletion. If the retry keeps failing,
                    sign out and sign in again to refresh your session, then retry.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeDeleteModal} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRetryDeleteAccount}
                loading={isDeleting}
                disabled={isDeleting}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          // ── Initial confirmation state ─────────────────────────────
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <FiAlertTriangle
                  className="w-4 h-4 text-red-600 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm text-red-700 font-medium">This cannot be undone</span>
              </div>
              <p className="text-xs text-red-600">
                All resumes, data, and settings will be permanently deleted.
              </p>
            </div>

            <div>
              <p className="text-sm mb-2">Type your email to confirm:</p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={user?.email}
                disabled={isDeleting}
                autoComplete="off"
              />
            </div>

            {userHasPassword && (
              <div>
                <p className="text-sm mb-2">Enter your password to confirm:</p>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your current password"
                  disabled={isDeleting}
                  autoComplete="current-password"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeDeleteModal} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                loading={isDeleting}
                disabled={
                  isDeleting ||
                  deleteConfirmText !== user?.email ||
                  (userHasPassword && !deletePassword)
                }
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default Settings;