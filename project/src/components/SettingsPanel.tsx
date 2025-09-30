import React, { useState } from 'react';
import { Lock, Shield, Globe, Bell, User, Smartphone, Wifi, Database, Download, Upload } from 'lucide-react';

interface SettingsPanelProps {
  user?: any;
  onLogout?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('security');
  
  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
  };

  const settingsTabs = [
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'device', label: 'Device', icon: Smartphone },
    { id: 'sync', label: 'Sync & Backup', icon: Database },
  ];

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Biometric Login</p>
              <p className="text-sm text-gray-600">Use fingerprint or face recognition</p>
            </div>
            <div className="flex items-center">
              <input type="checkbox" defaultChecked className="toggle-checkbox" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">Require additional verification</p>
            </div>
            <div className="flex items-center">
              <input type="checkbox" defaultChecked className="toggle-checkbox" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Auto-Lock</p>
              <p className="text-sm text-gray-600">Lock after inactivity</p>
            </div>
            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option>5 minutes</option>
              <option>10 minutes</option>
              <option>15 minutes</option>
              <option>30 minutes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Protection</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">End-to-End Encryption</p>
              <p className="text-sm text-gray-600">Encrypt all data transmissions</p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Active</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Remote Wipe</p>
              <p className="text-sm text-gray-600">Enable remote data deletion</p>
            </div>
            <div className="flex items-center">
              <input type="checkbox" defaultChecked className="toggle-checkbox" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Blockchain Verification</p>
              <p className="text-sm text-gray-600">Tamper-proof evidence hashing</p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-600">Enabled</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Protocols</h3>
        
        <div className="space-y-4">
          <button className="w-full p-3 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50">
            Test Emergency Wipe Procedure
          </button>
          
          <button className="w-full p-3 border-2 border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50">
            Update Emergency Contacts
          </button>
        </div>
      </div>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Officer Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Badge Number</label>
            <input
              type="text"
              value={user?.badge_number || ""}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rank</label>
            <input
              type="text"
              value={user?.rank || ""}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <input
              type="text"
              value={user?.department || ""}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
            <input
              type="text"
              value={user?.division || ""}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              readOnly
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
          <input
            type="tel"
            value={user?.emergency_contact || ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            readOnly
          />
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => handleLogout()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">High Priority Alerts</p>
              <p className="text-sm text-gray-600">Emergency calls and officer safety</p>
            </div>
            <input type="checkbox" defaultChecked className="toggle-checkbox" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Stress Level Warnings</p>
              <p className="text-sm text-gray-600">Wellness monitoring alerts</p>
            </div>
            <input type="checkbox" defaultChecked className="toggle-checkbox" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Case Updates</p>
              <p className="text-sm text-gray-600">Evidence processing and FIR status</p>
            </div>
            <input type="checkbox" defaultChecked className="toggle-checkbox" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">System Maintenance</p>
              <p className="text-sm text-gray-600">App updates and sync status</p>
            </div>
            <input type="checkbox" className="toggle-checkbox" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sound & Vibration</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">Alert Volume</p>
            <select className="border border-gray-300 rounded-md px-3 py-2">
              <option>Silent</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">Vibration</p>
            <input type="checkbox" defaultChecked className="toggle-checkbox" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeviceSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wifi className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Network Connection</p>
                <p className="text-sm text-gray-600">4G LTE - Strong signal</p>
              </div>
            </div>
            <span className="text-sm text-green-600">Connected</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">Storage Usage</p>
                <p className="text-sm text-gray-600">8.2 GB of 32 GB used</p>
              </div>
            </div>
            <span className="text-sm text-blue-600">25% Used</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Security Status</p>
                <p className="text-sm text-gray-600">All systems secure</p>
              </div>
            </div>
            <span className="text-sm text-green-600">Protected</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Offline Capabilities</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Offline Mode</p>
              <p className="text-sm text-gray-600">Continue working without internet</p>
            </div>
            <input type="checkbox" defaultChecked className="toggle-checkbox" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Local Storage Encryption</p>
              <p className="text-sm text-gray-600">Encrypt offline data</p>
            </div>
            <input type="checkbox" defaultChecked className="toggle-checkbox" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Auto-sync when online</p>
              <p className="text-sm text-gray-600">Upload data when connection restored</p>
            </div>
            <input type="checkbox" defaultChecked className="toggle-checkbox" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSyncSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Status</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Last Sync</p>
              <p className="text-sm text-gray-600">2 minutes ago</p>
            </div>
            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
              Sync Now
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Pending Items</p>
              <p className="text-sm text-gray-600">3 files waiting to upload</p>
            </div>
            <span className="text-sm text-orange-600">Queued</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup & Export</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Automatic Backup</p>
              <p className="text-sm text-gray-600">Daily encrypted backups</p>
            </div>
            <input type="checkbox" defaultChecked className="toggle-checkbox" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              <span>Import Data</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Retention</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">Evidence Retention Period</p>
            <select className="border border-gray-300 rounded-md px-3 py-2">
              <option>7 years</option>
              <option>10 years</option>
              <option>Permanent</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">Log Retention Period</p>
            <select className="border border-gray-300 rounded-md px-3 py-2">
              <option>1 year</option>
              <option>2 years</option>
              <option>5 years</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        <p className="text-gray-600">Configure your SmartCop application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <nav className="space-y-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'profile' && renderProfileSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'device' && renderDeviceSettings()}
          {activeTab === 'sync' && renderSyncSettings()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;