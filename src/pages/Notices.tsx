import React, { useState } from 'react';
import { BellIcon, PlusIcon, MagnifyingGlassIcon, TagIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { useNotices } from '../hooks/useNotices';
import { useAuth } from '../hooks/useAuth';
import { Dialog } from '@headlessui/react';
import { Notice } from '../firebase/noticeServices';

const Notices: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'important' | 'category'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const { user } = useAuth();
  const {
    notices,
    loading,
    createNotice,
    markAsRead,
  } = useNotices();

  const categories = [
    { id: 'general', name: '일반', color: 'bg-gray-100 text-gray-800' },
    { id: 'policy', name: '정책', color: 'bg-blue-100 text-blue-800' },
    { id: 'event', name: '행사', color: 'bg-green-100 text-green-800' },
    { id: 'hr', name: '인사', color: 'bg-purple-100 text-purple-800' },
    { id: 'it', name: 'IT', color: 'bg-orange-100 text-orange-800' },
    { id: 'other', name: '기타', color: 'bg-yellow-100 text-yellow-800' },
  ];

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notice.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (notice.tags && notice.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'important':
        return notice.isImportant;
      case 'category':
        return notice.category === selectedCategory;
      default:
        return true;
    }
  });

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleNoticeClick = async (notice: Notice) => {
    setSelectedNotice(notice);
    if (user && !notice.readBy?.includes(user.uid)) {
      await markAsRead(notice.id!, user.uid);
    }
  };

  const isRead = (notice: Notice) => {
    return user && notice.readBy?.includes(user.uid);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
        {user && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            새 공지 작성
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="제목, 내용, 작성자, 태그로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all' as const, name: '전체' },
            { id: 'important' as const, name: '중요' },
            { id: 'category' as const, name: '카테고리' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Category Filter */}
      {activeTab === 'category' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedCategory === category.id
                      ? category.color
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notices List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            공지사항 목록 ({filteredNotices.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredNotices.length > 0 ? (
            filteredNotices.map((notice) => (
              <div
                key={notice.id}
                onClick={() => handleNoticeClick(notice)}
                className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                  !isRead(notice) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {notice.isImportant && (
                        <BellIcon className="h-5 w-5 text-red-500" />
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getCategoryInfo(notice.category).color
                      }`}>
                        {getCategoryInfo(notice.category).name}
                      </span>
                      {!isRead(notice) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          새 공지
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm font-medium ${
                      isRead(notice) ? 'text-gray-900' : 'text-gray-900 font-semibold'
                    }`}>
                      {notice.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {notice.content}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {notice.authorName}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatDate(notice.publishedAt || notice.createdAt)}
                      </div>
                      {notice.tags && notice.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <TagIcon className="h-4 w-4" />
                          {notice.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>표시할 공지사항이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <Dialog open={!!selectedNotice} onClose={() => setSelectedNotice(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black bg-opacity-25" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  {selectedNotice.isImportant && (
                    <BellIcon className="h-6 w-6 text-red-500" />
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getCategoryInfo(selectedNotice.category).color
                  }`}>
                    {getCategoryInfo(selectedNotice.category).name}
                  </span>
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    {selectedNotice.title}
                  </Dialog.Title>
                </div>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {selectedNotice.authorName}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatDate(selectedNotice.publishedAt || selectedNotice.createdAt)}
                  </div>
                  {selectedNotice.tags && selectedNotice.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <TagIcon className="h-4 w-4 mr-1" />
                      {selectedNotice.tags.map((tag: string, index: number) => (
                        <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {selectedNotice.content}
                  </div>
                </div>

                {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">첨부 파일</h4>
                    <div className="space-y-2">
                      {selectedNotice.attachments.map((attachment: string, index: number) => (
                        <a
                          key={index}
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                        >
                          첨부파일 {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}

      {/* Create Notice Modal */}
      {showCreateForm && (
        <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black bg-opacity-25" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <Dialog.Title className="text-lg font-medium text-gray-900">
                  새 공지 작성
                </Dialog.Title>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <NoticeForm
                  onSubmit={async (noticeData) => {
                    try {
                      await createNotice(noticeData);
                      setShowCreateForm(false);
                      alert('공지사항이 성공적으로 등록되었습니다.');
                    } catch {
                      alert('공지사항 등록에 실패했습니다.');
                    }
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </div>
  );
};

// Notice Form Component
const NoticeForm: React.FC<{
  onSubmit: (data: Omit<Notice, 'id'>) => Promise<void>;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as Notice['category'],
    isImportant: false,
    tags: [] as string[],
    isPublished: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // 유효성 검사
    if (formData.title.trim().length < 2) {
      alert('제목은 최소 2자 이상 입력해주세요.');
      return;
    }
    if (formData.content.trim().length < 10) {
      alert('내용은 최소 10자 이상 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const noticeData = {
        ...formData,
        title: formData.title.trim(),
        content: formData.content.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Unknown',
        publishedAt: formData.isPublished ? new Date() : undefined,
        readBy: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await onSubmit(noticeData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제목 *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          카테고리
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Notice['category'] }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="general">일반</option>
          <option value="policy">정책</option>
          <option value="event">행사</option>
          <option value="hr">인사</option>
          <option value="it">IT</option>
          <option value="other">기타</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          내용 *
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          태그 (쉼표로 구분)
        </label>
        <input
          type="text"
          value={formData.tags.join(', ')}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="중요, 긴급, 공지"
        />
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isImportant}
            onChange={(e) => setFormData(prev => ({ ...prev, isImportant: e.target.checked }))}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">중요 공지</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isPublished}
            onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">즉시 발행</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              처리 중...
            </>
          ) : (
            formData.isPublished ? '발행' : '임시저장'
          )}
        </button>
      </div>
    </form>
  );
};

export default Notices;