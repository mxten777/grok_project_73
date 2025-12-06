import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserCircleIcon, Bars3Icon, MagnifyingGlassIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import NotificationBell from '../molecules/NotificationBell';

interface TopbarProps {
  onMenuClick?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 글로벌 검색 로직 구현
      console.log('Searching for:', searchQuery);
      setShowSearchResults(true);
      // TODO: 검색 결과를 표시하는 모달이나 페이지로 이동
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    // 약간의 지연을 두고 검색 결과 숨기기
    setTimeout(() => setShowSearchResults(false), 200);
  };

  return (
    <div className="bg-white dark:bg-neutral-800 shadow-soft border-b border-neutral-200 dark:border-neutral-700 transition-colors duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors duration-200"
                onClick={onMenuClick}
              >
                <span className="sr-only">메뉴 열기</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
              <h2 className="ml-2 md:ml-0 text-lg font-semibold text-neutral-900 dark:text-neutral-100 font-display">대시보드</h2>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {/* 글로벌 검색 */}
            <div className="relative">
              <form onSubmit={handleSearch} className="relative">
                <div className={`relative ${isSearchFocused ? 'ring-2 ring-primary-500 ring-opacity-50' : ''} transition-all duration-200`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="프로젝트, 사용자, 문서 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className="input w-80 pl-10 pr-3 py-2 bg-neutral-50 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:border-primary-500 dark:focus:border-primary-400"
                  />
                </div>
              </form>

              {/* 검색 결과 드롭다운 */}
              {showSearchResults && searchQuery.trim() && (
                <div className="absolute z-50 mt-2 w-80 bg-white dark:bg-neutral-800 shadow-large max-h-96 rounded-lg py-2 text-base ring-1 ring-neutral-200 dark:ring-neutral-700 overflow-auto focus:outline-none sm:text-sm border border-neutral-200 dark:border-neutral-700">
                  <div className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    빠른 검색 결과
                  </div>

                  {/* 프로젝트 결과 */}
                  <div className="border-t border-neutral-100 dark:border-neutral-700">
                    <div className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      프로젝트
                    </div>
                    <a href="#" className="flex items-center px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-medium">P</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">웹사이트 리뉴얼 프로젝트</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">진행중 • 마감일: 2025-12-31</p>
                      </div>
                    </a>
                  </div>

                  {/* 사용자 결과 */}
                  <div className="border-t border-neutral-100 dark:border-neutral-700">
                    <div className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      사용자
                    </div>
                    <a href="#" className="flex items-center px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">김</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">김철수</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">개발팀 • chulsoo@example.com</p>
                      </div>
                    </a>
                  </div>

                  {/* 더 많은 결과 보기 */}
                  <div className="border-t border-neutral-100 dark:border-neutral-700">
                    <a href="#" className="block px-4 py-3 text-sm text-primary-600 dark:text-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200">
                      더 많은 결과 보기 →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors duration-200"
              title={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            <NotificationBell />

            <div className="ml-3 relative">
              <div className="flex items-center">
                <button
                  type="button"
                  className="bg-neutral-100 dark:bg-neutral-700 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">사용자 메뉴 열기</span>
                  <UserCircleIcon className="h-8 w-8 text-neutral-400" aria-hidden="true" />
                </button>
                <span className="ml-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">{user?.displayName || user?.email}</span>
                <button
                  onClick={logout}
                  className="ml-4 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-200"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;