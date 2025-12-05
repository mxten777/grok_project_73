import React, { useState, useEffect, useMemo } from 'react';
import { useSystemSettings } from '../../hooks/useAdmin';
import { SystemSettings } from '../../firebase/adminServices';

const SystemSettingsComponent: React.FC = () => {
  const { settings, loading, error, updateSettings, createSettings } = useSystemSettings();
  const [formData, setFormData] = useState<SystemSettings>(() => ({
    id: '',
    companyName: '',
    companyLogo: '',
    allowRegistration: true,
    defaultUserRole: 'user',
    features: {
      chat: true,
      approval: true,
      attendance: true,
      calendar: true,
      notices: true,
      projects: true,
    },
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    updatedAt: new Date(),
  }));

  // Initialize form data when settings are loaded
  const initialFormData = useMemo(() => {
    if (settings) {
      return settings;
    }
    return {
      name: '',
      logo: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      website: '',
      allowRegistration: true,
      requireEmailVerification: true,
      defaultUserRole: 'user' as const,
      maintenanceMode: false,
      maintenanceMessage: '',
    };
  }, [settings]);

  useEffect(() => {
    setFormData(initialFormData as any);
  }, [initialFormData]);

  const handleSave = async () => {
    try {
      if (settings) {
        await updateSettings(settings.id, formData);
      } else {
        await createSettings(formData);
      }
      alert('설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    }
  };

  const handleFeatureToggle = (feature: keyof SystemSettings['features']) => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [feature]: !formData.features[feature],
      },
    });
  };

  const handleNotificationToggle = (notification: keyof SystemSettings['notifications']) => {
    setFormData({
      ...formData,
      notifications: {
        ...formData.notifications,
        [notification]: !formData.notifications[notification],
      },
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">시스템 설정</h2>
        <p className="mt-1 text-sm text-gray-600">회사 정보와 시스템 기능을 설정하세요</p>
      </div>

      <div className="space-y-8">
        {/* 회사 정보 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">회사 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">회사명</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">기본 사용자 권한</label>
              <select
                value={formData.defaultUserRole}
                onChange={(e) => setFormData({ ...formData, defaultUserRole: e.target.value as SystemSettings['defaultUserRole'] })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="user">사용자</option>
                <option value="manager">매니저</option>
                <option value="admin">관리자</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">회사 로고 URL</label>
            <input
              type="url"
              value={formData.companyLogo || ''}
              onChange={(e) => setFormData({ ...formData, companyLogo: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allowRegistration}
                onChange={(e) => setFormData({ ...formData, allowRegistration: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">사용자 스스로 회원가입 허용</span>
            </label>
          </div>
        </div>

        {/* 기능 설정 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">기능 설정</h3>
          <p className="text-sm text-gray-600 mb-4">활성화할 시스템 기능을 선택하세요</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formData.features).map(([feature, enabled]) => (
              <label key={feature} className="flex items-center">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => handleFeatureToggle(feature as keyof SystemSettings['features'])}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {feature === 'chat' && '실시간 채팅'}
                  {feature === 'approval' && '전자결재'}
                  {feature === 'attendance' && '근태관리'}
                  {feature === 'calendar' && '캘린더'}
                  {feature === 'notices' && '공지사항'}
                  {feature === 'projects' && '프로젝트 보드'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">알림 설정</h3>
          <p className="text-sm text-gray-600 mb-4">알림 전송 방식을 선택하세요</p>
          <div className="space-y-3">
            {Object.entries(formData.notifications).map(([notification, enabled]) => (
              <label key={notification} className="flex items-center">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => handleNotificationToggle(notification as keyof SystemSettings['notifications'])}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {notification === 'email' && '이메일 알림'}
                  {notification === 'push' && '푸시 알림'}
                  {notification === 'sms' && 'SMS 알림'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsComponent;