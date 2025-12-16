import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../../config/api';
import toast from 'react-hot-toast';
import { Save, Settings, Bell, Shield, Database, Mail } from 'lucide-react';

const SettingsPanel = () => {
  const [settings, setSettings] = useState({
    system: {
      maintenanceMode: false,
      registrationEnabled: true,
      maxUsersPerInstitution: 100
    },
    notifications: {
      emailNotifications: true,
      newUserAlerts: true,
      paymentAlerts: true,
      systemAlerts: true
    },
    security: {
      sessionTimeout: 30,
      requireEmailVerification: true,
      enable2FA: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async (category) => {
    setSaving(true);
    try {
      // In a real app, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      toast.success(`${category} settings saved successfully`);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const SettingSection = ({ title, icon: Icon, category, children }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <button
          onClick={() => handleSave(category)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>
      {children}
    </div>
  );

  const ToggleSwitch = ({ label, description, checked, onChange }) => (
    <div className="flex items-start justify-between py-4 border-b border-white/5 last:border-0">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
      </label>
    </div>
  );

  const NumberInput = ({ label, description, value, onChange, min, max }) => (
    <div className="py-4 border-b border-white/5 last:border-0">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        min={min}
        max={max}
        className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-gray-400 text-sm mt-1">Manage system configuration and preferences</p>
      </div>

      {/* System Settings */}
      <SettingSection title="System Settings" icon={Settings} category="system">
        <ToggleSwitch
          label="Maintenance Mode"
          description="Enable maintenance mode to restrict access"
          checked={settings.system.maintenanceMode}
          onChange={(value) => handleChange('system', 'maintenanceMode', value)}
        />
        <ToggleSwitch
          label="Registration Enabled"
          description="Allow new user registrations"
          checked={settings.system.registrationEnabled}
          onChange={(value) => handleChange('system', 'registrationEnabled', value)}
        />
        <NumberInput
          label="Max Users Per Institution"
          description="Maximum number of users allowed per institution"
          value={settings.system.maxUsersPerInstitution}
          onChange={(value) => handleChange('system', 'maxUsersPerInstitution', value)}
          min={1}
          max={1000}
        />
      </SettingSection>

      {/* Notification Settings */}
      <SettingSection title="Notification Settings" icon={Bell} category="notifications">
        <ToggleSwitch
          label="Email Notifications"
          description="Enable email notifications for admin alerts"
          checked={settings.notifications.emailNotifications}
          onChange={(value) => handleChange('notifications', 'emailNotifications', value)}
        />
        <ToggleSwitch
          label="New User Alerts"
          description="Get notified when new users register"
          checked={settings.notifications.newUserAlerts}
          onChange={(value) => handleChange('notifications', 'newUserAlerts', value)}
        />
        <ToggleSwitch
          label="Payment Alerts"
          description="Get notified about payment transactions"
          checked={settings.notifications.paymentAlerts}
          onChange={(value) => handleChange('notifications', 'paymentAlerts', value)}
        />
        <ToggleSwitch
          label="System Alerts"
          description="Get notified about system issues"
          checked={settings.notifications.systemAlerts}
          onChange={(value) => handleChange('notifications', 'systemAlerts', value)}
        />
      </SettingSection>

      {/* Security Settings */}
      <SettingSection title="Security Settings" icon={Shield} category="security">
        <NumberInput
          label="Session Timeout (minutes)"
          description="Auto-logout after inactivity"
          value={settings.security.sessionTimeout}
          onChange={(value) => handleChange('security', 'sessionTimeout', value)}
          min={5}
          max={480}
        />
        <ToggleSwitch
          label="Require Email Verification"
          description="Users must verify their email before accessing the platform"
          checked={settings.security.requireEmailVerification}
          onChange={(value) => handleChange('security', 'requireEmailVerification', value)}
        />
        <ToggleSwitch
          label="Enable 2FA"
          description="Enable two-factor authentication for super admin"
          checked={settings.security.enable2FA}
          onChange={(value) => handleChange('security', 'enable2FA', value)}
        />
      </SettingSection>
    </div>
  );
};

export default SettingsPanel;

