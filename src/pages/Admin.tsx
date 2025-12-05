import React, { useState } from 'react';
import { UserGroupIcon, CogIcon, DocumentTextIcon, CloudIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import UserManagement from '../components/admin/UserManagement';
import GroupManagement from '../components/admin/GroupManagement';
import SystemSettings from '../components/admin/SystemSettings';
import LogsMonitoring from '../components/admin/LogsMonitoring';
import StorageManagement from '../components/admin/StorageManagement';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', name: '사용자 관리', icon: UserGroupIcon, component: UserManagement },
    { id: 'groups', name: '그룹 관리', icon: ShieldCheckIcon, component: GroupManagement },
    { id: 'settings', name: '시스템 설정', icon: CogIcon, component: SystemSettings },
    { id: 'logs', name: '로그 모니터링', icon: DocumentTextIcon, component: LogsMonitoring },
    { id: 'storage', name: '스토리지 관리', icon: CloudIcon, component: StorageManagement },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || UserManagement;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">관리자 시스템</h1>
          <p className="mt-2 text-gray-600">사용자, 그룹, 시스템 설정을 관리하세요</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-white shadow rounded-lg">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default Admin;