import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Switch from '../components/ui/Switch';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import { FiBell, FiLock, FiGlobe, FiMoon } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    resumeUpdates: true,
    marketingEmails: false,
    twoFactorAuth: false,
    autoSave: true,
    publicProfile: false
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  const tabs = [
    {
      label: (
        <span className="flex items-center gap-2">
          <FiBell className="w-4 h-4" />
          Notifications
        </span>
      ),
      content: (
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive email updates about your account</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Resume Updates</p>
                <p className="text-sm text-gray-500">Get notified when your resume is viewed</p>
              </div>
              <Switch
                checked={settings.resumeUpdates}
                onChange={(e) => handleSettingChange('resumeUpdates', e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Emails</p>
                <p className="text-sm text-gray-500">Receive tips and special offers</p>
              </div>
              <Switch
                checked={settings.marketingEmails}
                onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
              />
            </div>
          </div>
        </Card>
      )
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <FiLock className="w-4 h-4" />
          Security
        </span>
      ),
      content: (
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
              />
            </div>

            <Button variant="outline">Change Password</Button>
          </div>
        </Card>
      )
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <FiGlobe className="w-4 h-4" />
          Preferences
        </span>
      ),
      content: (
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold mb-4">Application Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-save Resumes</p>
                <p className="text-sm text-gray-500">Automatically save changes as you type</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Public Profile</p>
                <p className="text-sm text-gray-500">Make your profile visible to others</p>
              </div>
              <Switch
                checked={settings.publicProfile}
                onChange={(e) => handleSettingChange('publicProfile', e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium flex items-center gap-2">
                  <FiMoon className="w-4 h-4" />
                  Dark Mode
                </p>
                <p className="text-sm text-gray-500">Toggle dark/light theme</p>
              </div>
              <Switch
                checked={isDark}
                onChange={toggleTheme}
              />
            </div>
          </div>
        </Card>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold gradient-text">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account preferences</p>
        </div>

        <Tabs tabs={tabs} />

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;