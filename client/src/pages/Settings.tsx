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
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="font-semibold text-surface-900 dark:text-white">Profile</h3>
          </div>
          <div className="card-body space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-surface-200 text-surface-700 dark:bg-dark-700 dark:text-dark-100 rounded flex items-center justify-center">
                <span className="text-2xl font-semibold text-white">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-surface-900 dark:text-white">{user?.name}</p>
                <p className="text-sm text-surface-500 dark:text-dark-400">{user?.email}</p>
                <Badge color={user?.role === 'admin' ? 'danger' : user?.role === 'manager' ? 'warning' : 'info'} className="mt-1">
                  {user?.role}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Full name</label>
                <input defaultValue={user?.name} className="input-field" />
              </div>
              <div>
                <label className="label-field">Email</label>
                <input defaultValue={user?.email} disabled className="input-field opacity-60" />
              </div>
              <div>
                <label className="label-field">Title</label>
                <input defaultValue={user?.title} className="input-field" />
              </div>
              <div>
                <label className="label-field">Department</label>
                <input defaultValue={user?.department} className="input-field" />
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-surface-400" />
              <h3 className="font-semibold text-surface-900 dark:text-white">Security</h3>
            </div>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label-field">Change password</label>
              <input type="password" placeholder="Current password" className="input-field mb-3" />
              <input type="password" placeholder="New password" className="input-field mb-3" />
              <input type="password" placeholder="Confirm new password" className="input-field" />
            </div>
            <div className="flex items-center justify-between bg-surface-50 dark:bg-dark-800/60 rounded p-4 ring-1 ring-surface-100 dark:ring-dark-700">
              <div className="flex items-center gap-3">
                <div className="icon-well !w-9 !h-9 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">Two-factor authentication</p>
                  <p className="text-xs text-surface-500 dark:text-dark-400">Add an extra layer of security</p>
                </div>
              </div>
              <button className="btn-secondary text-xs py-2">Enable</button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-surface-400" />
              <h3 className="font-semibold text-surface-900 dark:text-white">Notification Preferences</h3>
            </div>
          </div>
          <div className="card-body space-y-1">
            {['New lead assignments', 'Follow-up reminders', 'Overdue task alerts', 'Deal status changes'].map((pref) => (
              <label key={pref} className="flex items-center justify-between cursor-pointer py-2.5 px-3 rounded hover:bg-surface-50 dark:hover:bg-dark-800/50 transition-colors">
                <span className="text-sm font-medium text-surface-700 dark:text-dark-200">{pref}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded-md focus:ring-primary-500 border-surface-300" />
              </label>
            ))}
          </div>
        </div>

        {/* System info */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-surface-400" />
              <h3 className="font-semibold text-surface-900 dark:text-white">System Information</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Version', value: 'v1.0.0' },
                { label: 'Environment', value: 'Production' },
                { label: 'Database', value: 'MongoDB' },
                { label: 'Last backup', value: '—' },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded bg-surface-50 dark:bg-dark-800/50">
                  <p className="text-xs font-medium text-surface-500 dark:text-dark-400">{item.label}</p>
                  <p className="font-semibold text-surface-900 dark:text-white mt-0.5">{item.value}</p>
                </div>
              ))}
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
