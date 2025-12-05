import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, DocumentTextIcon, ClockIcon, ChatBubbleLeftRightIcon, CalendarIcon, MegaphoneIcon, FolderIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: '대시보드', href: '/', icon: HomeIcon },
  { name: '전자결재', href: '/approvals', icon: DocumentTextIcon },
  { name: '근태관리', href: '/attendance', icon: ClockIcon },
  { name: '메신저', href: '/messenger', icon: ChatBubbleLeftRightIcon },
  { name: '캘린더', href: '/calendar', icon: CalendarIcon },
  { name: '공지사항', href: '/notices', icon: MegaphoneIcon },
  { name: '프로젝트', href: '/projects', icon: FolderIcon },
  { name: '관리자', href: '/admin', icon: Cog6ToothIcon },
];

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          {onClose && (
            <button
              onClick={onClose}
              className="mr-2 p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900">그룹웨어</h1>
        </div>
        <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;