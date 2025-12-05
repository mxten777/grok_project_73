import React, { useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { PushNotification } from '../../firebase/notificationServices';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    permission,
    loading,
    requestPermission,
    markAsRead,
    markAllAsRead,
    getNotificationIcon,
    getNotificationColor
  } = useNotifications();

  const [showAll, setShowAll] = useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);

  const handleNotificationClick = (notification: PushNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // 알림 타입에 따라 페이지 이동
    switch (notification.type) {
      case 'chat':
        // 채팅 페이지로 이동
        break;
      case 'approval':
        navigate('/approvals');
        break;
      case 'notice':
        navigate('/notices');
        break;
      case 'calendar':
        navigate('/calendar');
        break;
      case 'project':
        navigate('/projects');
        break;
    }
  };

  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    if (granted) {
      alert('알림 권한이 허용되었습니다.');
    } else {
      alert('알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
    }
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full">
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-80 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">알림</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  모두 읽음
                </button>
              )}
            </div>
            {permission !== 'granted' && (
              <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                <p className="text-xs text-yellow-800">
                  푸시 알림을 받으려면 권한을 허용해주세요.
                </p>
                <button
                  onClick={handlePermissionRequest}
                  className="mt-1 text-xs text-yellow-800 underline hover:text-yellow-900"
                >
                  권한 허용하기
                </button>
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                로딩 중...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                새로운 알림이 없습니다.
              </div>
            ) : (
              displayedNotifications.map((notification) => (
                <Menu.Item key={notification.id}>
                  {({ active }) => (
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 cursor-pointer ${
                        active ? 'bg-gray-50' : ''
                      } ${!notification.read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Menu.Item>
              ))
            )}
          </div>

          {notifications.length > 5 && (
            <div className="px-4 py-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-blue-600 hover:text-blue-500 w-full text-center"
              >
                {showAll ? '접기' : `더 보기 (${notifications.length - 5}개)`}
              </button>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default NotificationBell;