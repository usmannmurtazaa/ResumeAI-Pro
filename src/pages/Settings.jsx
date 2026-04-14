import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Switch from '../components/ui/Switch';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import Tooltip from '../components/ui/Tooltip';
import { 
  FiBell, 
  FiLock, 
  FiGlobe, 
  FiMoon, 
  FiSun,
  FiSave,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiLogOut,
  FiShield,
  FiKey,
  FiMail,
  FiPhone,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiClock,
  FiCalendar,
  FiCreditCard,
  FiHelpCircle,
  FiChevronRight,
  FiUserX,
  FiDatabase,
  FiZap,
  FiVolume2,
  FiVolumeX,
  FiWifi,
  FiWifiOff,
  FiHardDrive
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout, updateUserProfile, deleteAccount } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notificationSettings, updateNotificationSettings } = useNotification();
  
  const [activeTab, setActiveTab] = useState('notifications');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [exportFormat, setExportFormat] = useState('json');
  
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    resumeUpdates: true,
    atsScoreAlerts: true,
    marketingEmails: false,
    weeklyDigest: true,
    securityAlerts: true,
    soundEnabled: true,
    
    // Privacy & Security
    twoFactorAuth: false,
    sessionTimeout: '30',
    loginAlerts: true,
    showEmail: false,
    showPhone: false,
    showLocation: false,
    dataCollection: true,
    
    // Preferences
    autoSave: true,
    autoSaveInterval: '30',
    defaultTemplate: 'modern',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    compactMode: false,
    reducedMotion: false,
    highContrast: false,
    
    // Data & Storage
    cacheEnabled: true,
    offlineMode: true,
    autoDownload: false,
    compressImages: true,
    storageLocation: 'cloud'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [sessions, setSessions] = useState([
    { id: 1, device: 'MacBook Pro', browser: 'Chrome', location: 'San Francisco, CA', lastActive: 'Now', current: true },
    { id: 2, device: 'iPhone 15 Pro', browser: 'Safari', location: 'San Francisco, CA', lastActive: '2 hours ago', current: false },
    { id: 3, device: 'Windows PC', browser: 'Firefox', location: 'New York, NY', lastActive: '3 days ago', current: false }
  ]);

  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update notification settings in context
      updateNotificationSettings({
        email: settings.emailNotifications,
        push: settings.pushNotifications,
        resumeUpdates: settings.resumeUpdates,
        marketing: settings.marketingEmails
      });
      
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setChangingPassword(true);
    try {
      await updateUserProfile({ password: passwordForm.newPassword });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = {
        profile: user,
        settings,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resumeai-export-${Date.now()}.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
      setShowExportModal(false);
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user?.email) {
      toast.error('Please type your email to confirm');
      return;
    }
    
    try {
      await deleteAccount();
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const handleRevokeSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    toast.success('Session revoked');
  };

  const handleGenerateBackupCodes = () => {
    const codes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    setBackupCodes(codes);
    setShowBackupCodes(true);
  };

  const handleDownloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: FiBell,
      content: (
        <NotificationsTab 
          settings={settings} 
          onChange={handleSettingChange} 
        />
      )
    },
    {
      id: 'security',
      label: 'Security',
      icon: FiLock,
      content: (
        <SecurityTab 
          settings={settings}
          onChange={handleSettingChange}
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          showCurrentPassword={showCurrentPassword}
          setShowCurrentPassword={setShowCurrentPassword}
          showNewPassword={showNewPassword}
          setShowNewPassword={setShowNewPassword}
          changingPassword={changingPassword}
          onChangePassword={handleChangePassword}
          sessions={sessions}
          onRevokeSession={handleRevokeSession}
          backupCodes={backupCodes}
          showBackupCodes={showBackupCodes}
          setShowBackupCodes={setShowBackupCodes}
          onGenerateBackupCodes={handleGenerateBackupCodes}
          onDownloadBackupCodes={handleDownloadBackupCodes}
          onShowDeleteModal={() => setShowDeleteModal(true)}
        />
      )
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: FiGlobe,
      content: (
        <PreferencesTab 
          settings={settings}
          onChange={handleSettingChange}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
      )
    },
    {
      id: 'data',
      label: 'Data & Storage',
      icon: FiDatabase,
      content: (
        <DataTab 
          settings={settings}
          onChange={handleSettingChange}
          onExport={() => setShowExportModal(true)}
        />
      )
    }
  ];

  return (
    <DashboardLayout title="Settings" description="Manage your account preferences and settings">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Settings Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold gradient-text">Settings</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your account preferences and configuration
                </p>
              </div>
              <Button
                onClick={handleSave}
                loading={isSaving}
                icon={<FiSave />}
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Settings Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
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
            transition={{ duration: 0.2 }}
          >
            {tabs.find(t => t.id === activeTab)?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Export Data Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Your Data"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose the format for your data export. You'll receive all your profile information, settings, and preferences.
          </p>
          
          <div>
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <option value="json">JSON (Recommended)</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <FiInfo className="w-4 h-4" />
              Your data will be available for download immediately.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportData}>
              Export Data
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
              ⚠️ Warning: This action cannot be undone
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Deleting your account will permanently remove all your data including:
            </p>
            <ul className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-1 list-disc list-inside">
              <li>All resumes and templates</li>
              <li>Profile information</li>
              <li>Settings and preferences</li>
              <li>Analytics and history</li>
            </ul>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              To confirm, please type your email address:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={user?.email}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== user?.email}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

// Notifications Tab Component
const NotificationsTab = ({ settings, onChange }) => (
  <Card className="p-6">
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <SettingToggle
            title="Email Notifications"
            description="Receive email updates about your account"
            checked={settings.emailNotifications}
            onChange={(val) => onChange('emailNotifications', val)}
          />
          <SettingToggle
            title="Resume Updates"
            description="Get notified when your resume is viewed or downloaded"
            checked={settings.resumeUpdates}
            onChange={(val) => onChange('resumeUpdates', val)}
          />
          <SettingToggle
            title="ATS Score Alerts"
            description="Receive alerts when your ATS score changes"
            checked={settings.atsScoreAlerts}
            onChange={(val) => onChange('atsScoreAlerts', val)}
          />
          <SettingToggle
            title="Weekly Digest"
            description="Get a weekly summary of your resume performance"
            checked={settings.weeklyDigest}
            onChange={(val) => onChange('weeklyDigest', val)}
          />
          <SettingToggle
            title="Marketing Emails"
            description="Receive tips, updates, and special offers"
            checked={settings.marketingEmails}
            onChange={(val) => onChange('marketingEmails', val)}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Push Notifications</h3>
        <div className="space-y-4">
          <SettingToggle
            title="Push Notifications"
            description="Receive push notifications in your browser"
            checked={settings.pushNotifications}
            onChange={(val) => onChange('pushNotifications', val)}
          />
          <SettingToggle
            title="Security Alerts"
            description="Get immediate alerts for security events"
            checked={settings.securityAlerts}
            onChange={(val) => onChange('securityAlerts', val)}
          />
          <SettingToggle
            title="Sound"
            description="Play sound for notifications"
            checked={settings.soundEnabled}
            onChange={(val) => onChange('soundEnabled', val)}
            icon={settings.soundEnabled ? FiVolume2 : FiVolumeX}
          />
        </div>
      </div>
    </div>
  </Card>
);

// Security Tab Component
const SecurityTab = ({ 
  settings, 
  onChange, 
  passwordForm, 
  setPasswordForm,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  changingPassword,
  onChangePassword,
  sessions,
  onRevokeSession,
  backupCodes,
  showBackupCodes,
  setShowBackupCodes,
  onGenerateBackupCodes,
  onDownloadBackupCodes,
  onShowDeleteModal
}) => (
  <div className="space-y-6">
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Change Password</h3>
      <div className="space-y-4">
        <Input
          label="Current Password"
          type={showCurrentPassword ? 'text' : 'password'}
          value={passwordForm.currentPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
          rightIcon={
            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
              {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          }
        />
        <Input
          label="New Password"
          type={showNewPassword ? 'text' : 'password'}
          value={passwordForm.newPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          rightIcon={
            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          }
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={passwordForm.confirmPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
        />
        <Button onClick={onChangePassword} loading={changingPassword}>
          Update Password
        </Button>
      </div>
    </Card>

    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
      <div className="space-y-4">
        <SettingToggle
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
          checked={settings.twoFactorAuth}
          onChange={(val) => onChange('twoFactorAuth', val)}
        />
        
        {settings.twoFactorAuth && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {backupCodes.length === 0 ? (
              <Button onClick={onGenerateBackupCodes} variant="outline">
                Generate Backup Codes
              </Button>
            ) : (
              <div>
                <Button onClick={() => setShowBackupCodes(!showBackupCodes)} variant="outline" className="mb-3">
                  {showBackupCodes ? 'Hide' : 'Show'} Backup Codes
                </Button>
                {showBackupCodes && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code, i) => (
                        <code key={i} className="p-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm">
                          {code}
                        </code>
                      ))}
                    </div>
                    <Button size="sm" onClick={onDownloadBackupCodes}>
                      <FiDownload className="w-4 h-4 mr-2" />
                      Download Codes
                    </Button>
                    <p className="text-xs text-gray-500">
                      Save these codes in a secure place. You can use them to access your account if you lose your 2FA device.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>

    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
      <div className="space-y-3">
        {sessions.map(session => (
          <div key={session.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              {session.device.includes('Mac') ? <FiMonitor className="w-5 h-5" /> :
               session.device.includes('iPhone') ? <FiSmartphone className="w-5 h-5" /> :
               <FiTablet className="w-5 h-5" />}
              <div>
                <p className="font-medium">{session.device} • {session.browser}</p>
                <p className="text-xs text-gray-500">{session.location} • Last active: {session.lastActive}</p>
              </div>
            </div>
            {session.current ? (
              <Badge variant="success" size="sm">Current</Badge>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => onRevokeSession(session.id)}>
                Revoke
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button variant="outline" className="mt-4 w-full" onClick={() => toast.success('All other sessions revoked')}>
        <FiLogOut className="w-4 h-4 mr-2" />
        Sign Out All Other Sessions
      </Button>
    </Card>

    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
      <div className="space-y-4">
        <SettingToggle
          title="Login Alerts"
          description="Get notified of new sign-ins to your account"
          checked={settings.loginAlerts}
          onChange={(val) => onChange('loginAlerts', val)}
        />
        <div>
          <label className="block text-sm font-medium mb-2">Session Timeout</label>
          <select
            value={settings.sessionTimeout}
            onChange={(e) => onChange('sessionTimeout', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="never">Never</option>
          </select>
        </div>
      </div>
    </Card>

    <Card className="p-6 border-red-200 dark:border-red-800">
      <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Delete Account</p>
            <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
          </div>
          <Button variant="danger" onClick={onShowDeleteModal}>
            <FiTrash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  </div>
);

// Preferences Tab Component
const PreferencesTab = ({ settings, onChange, isDark, toggleTheme }) => (
  <div className="space-y-6">
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Appearance</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-gray-500">Toggle dark/light theme</p>
            </div>
          </div>
          <Switch checked={isDark} onChange={toggleTheme} />
        </div>
        <SettingToggle
          title="Compact Mode"
          description="Reduce spacing for a denser layout"
          checked={settings.compactMode}
          onChange={(val) => onChange('compactMode', val)}
        />
        <SettingToggle
          title="Reduced Motion"
          description="Minimize animations and transitions"
          checked={settings.reducedMotion}
          onChange={(val) => onChange('reducedMotion', val)}
        />
        <SettingToggle
          title="High Contrast"
          description="Increase contrast for better visibility"
          checked={settings.highContrast}
          onChange={(val) => onChange('highContrast', val)}
        />
      </div>
    </Card>

    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Editor Preferences</h3>
      <div className="space-y-4">
        <SettingToggle
          title="Auto-save"
          description="Automatically save changes as you type"
          checked={settings.autoSave}
          onChange={(val) => onChange('autoSave', val)}
        />
        {settings.autoSave && (
          <div>
            <label className="block text-sm font-medium mb-2">Auto-save Interval (seconds)</label>
            <select
              value={settings.autoSaveInterval}
              onChange={(e) => onChange('autoSaveInterval', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
              <option value="120">2 minutes</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2">Default Template</label>
          <select
            value={settings.defaultTemplate}
            onChange={(e) => onChange('defaultTemplate', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="modern">Modern Professional</option>
            <option value="classic">Classic Executive</option>
            <option value="creative">Creative Portfolio</option>
            <option value="minimal">Minimalist</option>
            <option value="tech">Tech Innovator</option>
          </select>
        </div>
      </div>
    </Card>

    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Regional Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Language</label>
          <select
            value={settings.language}
            onChange={(e) => onChange('language', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="zh">中文</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Timezone</label>
          <select
            value={settings.timezone}
            onChange={(e) => onChange('timezone', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="America/New_York">Eastern Time (US & Canada)</option>
            <option value="America/Chicago">Central Time (US & Canada)</option>
            <option value="America/Denver">Mountain Time (US & Canada)</option>
            <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
            <option value="Europe/London">London</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Date Format</label>
          <select
            value={settings.dateFormat}
            onChange={(e) => onChange('dateFormat', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </Card>

    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
      <div className="space-y-4">
        <SettingToggle
          title="Show Email on Profile"
          description="Make your email visible to others"
          checked={settings.showEmail}
          onChange={(val) => onChange('showEmail', val)}
        />
        <SettingToggle
          title="Show Phone Number"
          description="Make your phone number visible"
          checked={settings.showPhone}
          onChange={(val) => onChange('showPhone', val)}
        />
        <SettingToggle
          title="Show Location"
          description="Display your location on your profile"
          checked={settings.showLocation}
          onChange={(val) => onChange('showLocation', val)}
        />
        <SettingToggle
          title="Usage Data Collection"
          description="Help us improve by sharing anonymous usage data"
          checked={settings.dataCollection}
          onChange={(val) => onChange('dataCollection', val)}
        />
      </div>
    </Card>
  </div>
);

// Data & Storage Tab Component
const DataTab = ({ settings, onChange, onExport }) => (
  <div className="space-y-6">
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Storage Settings</h3>
      <div className="space-y-4">
        <SettingToggle
          title="Enable Cache"
          description="Store data locally for faster loading"
          checked={settings.cacheEnabled}
          onChange={(val) => onChange('cacheEnabled', val)}
          icon={settings.cacheEnabled ? FiHardDrive : FiHardDrive}
        />
        <SettingToggle
          title="Offline Mode"
          description="Continue working without internet connection"
          checked={settings.offlineMode}
          onChange={(val) => onChange('offlineMode', val)}
          icon={settings.offlineMode ? FiWifi : FiWifiOff}
        />
        <SettingToggle
          title="Auto Download"
          description="Automatically download generated PDFs"
          checked={settings.autoDownload}
          onChange={(val) => onChange('autoDownload', val)}
        />
        <SettingToggle
          title="Compress Images"
          description="Reduce file size of uploaded images"
          checked={settings.compressImages}
          onChange={(val) => onChange('compressImages', val)}
        />
      </div>
    </Card>

    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Data Management</h3>
      <div className="space-y-4">
        <Button onClick={onExport} variant="outline" className="w-full">
          <FiDownload className="w-4 h-4 mr-2" />
          Export Your Data
        </Button>
        <Button variant="outline" className="w-full">
          <FiUpload className="w-4 h-4 mr-2" />
          Import Data
        </Button>
        <Button variant="outline" className="w-full">
          <FiRefreshCw className="w-4 h-4 mr-2" />
          Clear Cache
        </Button>
      </div>
    </Card>

    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Storage Usage</h3>
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>Resume Storage</span>
          <span>2.4 MB / 100 MB</span>
        </div>
        <Progress value={2.4} max={100} size="sm" />
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Template Storage</span>
          <span>0.8 MB / 50 MB</span>
        </div>
        <Progress value={1.6} max={50} size="sm" />
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Total Usage</span>
          <span>3.2 MB / 150 MB</span>
        </div>
        <Progress value={2.1} max={150} size="sm" />
      </div>
    </Card>
  </div>
);

// Setting Toggle Component
const SettingToggle = ({ title, description, checked, onChange, icon: Icon }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="w-5 h-5 text-gray-500" />}
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
    <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </div>
);

export default Settings;