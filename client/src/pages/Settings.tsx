import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Shield, KeyRound, Database, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/common/Badge';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved');
    }, 800);
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">System configuration</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900 dark:text-white">Profile</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-sm text-gray-500 dark:text-dark-400">{user?.email}</p>
                <Badge color={user?.role === 'admin' ? 'danger' : user?.role === 'manager' ? 'warning' : 'info'} className="mt-1">
                  {user?.role}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1.5">Full name</label>
                <input defaultValue={user?.name} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1.5">Email</label>
                <input defaultValue={user?.email} disabled className="input-field opacity-60" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1.5">Title</label>
                <input defaultValue={user?.title} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1.5">Department</label>
                <input defaultValue={user?.department} className="input-field" />
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Security</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1.5">Change password</label>
              <input type="password" placeholder="Current password" className="input-field mb-3" />
              <input type="password" placeholder="New password" className="input-field mb-3" />
              <input type="password" placeholder="Confirm new password" className="input-field" />
            </div>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Two-factor authentication</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">Add an extra layer of security</p>
                </div>
              </div>
              <button className="btn-secondary text-xs">Enable</button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
          </div>
          <div className="card-body space-y-3">
            {['New lead assignments', 'Follow-up reminders', 'Overdue task alerts', 'Deal status changes'].map((pref) => (
              <label key={pref} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-dark-200">{pref}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
              </label>
            ))}
          </div>
        </div>

        {/* System info */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">System Information</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-dark-400">Version</p>
                <p className="font-medium text-gray-900 dark:text-white">v1.0.0</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-dark-400">Environment</p>
                <p className="font-medium text-gray-900 dark:text-white">Production</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-dark-400">Database</p>
                <p className="font-medium text-gray-900 dark:text-white">MongoDB</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-dark-400">Last backup</p>
                <p className="font-medium text-gray-900 dark:text-white">—</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary px-8">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
