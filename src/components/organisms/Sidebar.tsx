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
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 shadow-soft">
      <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          {onClose && (
            <button
              onClick={onClose}
              className="mr-2 p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden transition-colors duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-display">그룹웨어</h1>
        </div>
        <nav className="mt-8 flex-1 px-3 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-r-2 border-primary-500'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-200'
                } group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-sm`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-500 dark:group-hover:text-neutral-300'
                  } mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200`}
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