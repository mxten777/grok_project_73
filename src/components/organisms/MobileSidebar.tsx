import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import {
  HomeIcon,
  DocumentTextIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  DocumentIcon,
  FolderIcon,
  CogIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useDeviceType } from '../../hooks/useDeviceType';
import { Link, useLocation } from 'react-router-dom';

const MobileSidebar: React.FC = () => {
  const { isMobile } = useDeviceType();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: '대시보드', href: '/', icon: HomeIcon },
    { name: '전자결재', href: '/approvals', icon: DocumentTextIcon },
    { name: '근태관리', href: '/attendance', icon: ClockIcon },
    { name: '메신저', href: '/messenger', icon: ChatBubbleLeftRightIcon },
    { name: '캘린더', href: '/calendar', icon: CalendarIcon },
    { name: '공지사항', href: '/notices', icon: DocumentIcon },
    { name: '프로젝트', href: '/projects', icon: FolderIcon },
    { name: '관리자', href: '/admin', icon: CogIcon },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  if (!isMobile) {
    // 데스크톱에서는 기존 Sidebar 사용
    return null;
  }

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg border border-gray-200 md:hidden"
      >
        <Bars3Icon className="h-6 w-6 text-gray-600" />
      </button>

      {/* 모바일 사이드바 오버레이 */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50 md:hidden">
        <div className="fixed inset-0 bg-black bg-opacity-25" />

        <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
          <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">메뉴</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* 네비게이션 */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* 푸터 */}
            <div className="p-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                그룹웨어 v1.0
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default MobileSidebar;