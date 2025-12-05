import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserCircleIcon, Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import NotificationBell from '../molecules/NotificationBell';

interface TopbarProps {
  onMenuClick?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [showSearchResults, setShowSearchResults] = useState(false);

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
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={onMenuClick}
              >
                <span className="sr-only">메뉴 열기</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
              <h2 className="ml-2 md:ml-0 text-lg font-semibold text-gray-900">대시보드</h2>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* 글로벌 검색 */}
            <div className="relative">
              <form onSubmit={handleSearch} className="relative">
                <div className={`relative ${isSearchFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="프로젝트, 사용자, 문서 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className="block w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </form>

              {/* 검색 결과 드롭다운 */}
              {showSearchResults && searchQuery.trim() && (
                <div className="absolute z-50 mt-1 w-80 bg-white shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    빠른 검색 결과
                  </div>

                  {/* 프로젝트 결과 */}
                  <div className="border-t border-gray-100">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      프로젝트
                    </div>
                    <a href="#" className="flex items-center px-4 py-2 hover:bg-gray-100">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-xs font-medium">P</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">웹사이트 리뉴얼 프로젝트</p>
                        <p className="text-xs text-gray-500">진행중 • 마감일: 2025-12-31</p>
                      </div>
                    </a>
                  </div>

                  {/* 사용자 결과 */}
                  <div className="border-t border-gray-100">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </div>
                    <a href="#" className="flex items-center px-4 py-2 hover:bg-gray-100">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">김</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">김철수</p>
                        <p className="text-xs text-gray-500">개발팀 • chulsoo@example.com</p>
                      </div>
                    </a>
                  </div>

                  {/* 더 많은 결과 보기 */}
                  <div className="border-t border-gray-100">
                    <a href="#" className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100">
                      더 많은 결과 보기 →
                    </a>
                  </div>
                </div>
              )}
            </div>

            <NotificationBell />

            <div className="ml-3 relative">
              <div className="flex items-center">
                <button
                  type="button"
                  className="bg-white flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">사용자 메뉴 열기</span>
                  <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                </button>
                <span className="ml-2 text-sm font-medium text-gray-700">{user?.displayName || user?.email}</span>
                <button
                  onClick={logout}
                  className="ml-4 text-sm text-gray-500 hover:text-gray-700"
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