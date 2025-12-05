import React, { useState, useRef } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { Dialog } from '@headlessui/react';
import {
  DocumentIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  Cog6ToothIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { Document, DocumentVersion } from '../firebase/documentServices';

const Documents: React.FC = () => {
  const { documents, loading, error, uploading, uploadDocument, getVersions, download, removeDocument, updatePermissions, hasPermission } = useDocuments();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'general',
    tags: '',
    readPermissions: 'all',
    writePermissions: '',
    deletePermissions: '',
  });

  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && fileInputRef.current) {
      // Create a new DataTransfer object and add the dropped files
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  // Get file type icon
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📈';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'zip':
      case 'rar':
        return '📦';
      default:
        return '📄';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(documents.map(doc => doc.category)))];

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory && hasPermission(doc, 'read');
  });

  const handleFileUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    const tags = uploadForm.tags ? uploadForm.tags.split(',').map(tag => tag.trim()) : [];

    try {
      await uploadDocument(file, {
        title: uploadForm.title,
        description: uploadForm.description,
        category: uploadForm.category,
        tags,
        permissions: {
          read: uploadForm.readPermissions === 'all' ? ['all'] : uploadForm.readPermissions.split(',').map(p => p.trim()),
          write: uploadForm.writePermissions.split(',').map(p => p.trim()).filter(p => p),
          delete: uploadForm.deletePermissions.split(',').map(p => p.trim()).filter(p => p),
        },
      });

      setShowUploadModal(false);
      setUploadForm({
        title: '',
        description: '',
        category: 'general',
        tags: '',
        readPermissions: 'all',
        writePermissions: '',
        deletePermissions: '',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // Error is handled in the hook
    }
  };

  const handleShowVersions = async (document: Document) => {
    if (!document.id) return;

    setSelectedDocument(document);
    try {
      const docVersions = await getVersions(document.id);
      setVersions(docVersions);
      setShowVersionsModal(true);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleShowPermissions = (document: Document) => {
    setSelectedDocument(document);
    setShowPermissionsModal(true);
  };

  const handleUpdatePermissions = async (permissions: { read: string[]; write: string[]; delete: string[] }) => {
    if (!selectedDocument?.id) return;

    try {
      await updatePermissions(selectedDocument.id, permissions);
      setShowPermissionsModal(false);
      setSelectedDocument(null);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!documentId || !confirm('정말로 이 문서를 삭제하시겠습니까?')) return;

    try {
      await removeDocument(documentId);
    } catch {
      // Error is handled in the hook
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">문서 라이브러리</h1>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="문서 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '모든 카테고리' : category}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CloudArrowUpIcon className="h-5 w-5" />
              문서 업로드
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(document.fileName)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{document.title}</h3>
                    <p className="text-sm text-gray-500">{formatFileSize(document.fileSize)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {hasPermission(document, 'write') && (
                    <button
                      onClick={() => handleShowPermissions(document)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="권한 설정"
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                    </button>
                  )}
                  {hasPermission(document, 'delete') && (
                    <button
                      onClick={() => document.id && handleDelete(document.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="삭제"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              {document.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{document.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded-full">{document.category}</span>
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>
                {document.tags && document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>업로드: {formatDate(document.createdAt)}</span>
                <span>v{document.version}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => document.id && download(document.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  다운로드
                </button>
                <button
                  onClick={() => handleShowVersions(document)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="버전 기록"
                >
                  <ClockIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">문서가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'all'
                ? '검색 조건에 맞는 문서가 없습니다.'
                : '첫 번째 문서를 업로드해보세요.'}
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onClose={() => setShowUploadModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">문서 업로드</Dialog.Title>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">파일 선택</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <CloudArrowUpIcon className={`mx-auto h-12 w-12 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        파일을 드래그하거나{' '}
                        <span className="text-blue-600 hover:text-blue-500">클릭해서 선택</span>
                      </span>
                    </label>
                    <input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      required
                      className="sr-only"
                      onChange={(e) => {
                        // 파일이 선택되었을 때의 처리
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadForm(prev => ({ ...prev, title: file.name }));
                        }
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, DOC, XLS 등 최대 10MB까지 업로드 가능
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">일반</option>
                  <option value="hr">인사</option>
                  <option value="finance">재무</option>
                  <option value="operations">운영</option>
                  <option value="legal">법무</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">태그 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="예: 중요, 긴급, 검토필요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">읽기 권한</label>
                <select
                  value={uploadForm.readPermissions}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, readPermissions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">모든 사용자</option>
                  <option value="">특정 사용자만</option>
                </select>
                {uploadForm.readPermissions !== 'all' && (
                  <input
                    type="text"
                    value={uploadForm.readPermissions}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, readPermissions: e.target.value }))}
                    placeholder="사용자 ID를 쉼표로 구분"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">쓰기 권한 (사용자 ID, 쉼표로 구분)</label>
                <input
                  type="text"
                  value={uploadForm.writePermissions}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, writePermissions: e.target.value }))}
                  placeholder="예: user1,user2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">삭제 권한 (사용자 ID, 쉼표로 구분)</label>
                <input
                  type="text"
                  value={uploadForm.deletePermissions}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, deletePermissions: e.target.value }))}
                  placeholder="예: admin,user1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? '업로드 중...' : '업로드'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Versions Modal */}
      <Dialog open={showVersionsModal} onClose={() => setShowVersionsModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">
              버전 기록 - {selectedDocument?.title}
            </Dialog.Title>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {versions.map((version) => (
                <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">버전 {version.versionNumber}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(version.uploadedAt)} • {version.uploadedBy}
                    </div>
                    {version.changelog && (
                      <div className="text-sm text-gray-600 mt-1">{version.changelog}</div>
                    )}
                  </div>
                  <button
                    onClick={() => selectedDocument?.id && download(selectedDocument.id, version.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    다운로드
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowVersionsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Permissions Modal */}
      <Dialog open={showPermissionsModal} onClose={() => setShowPermissionsModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">
              권한 설정 - {selectedDocument?.title}
            </Dialog.Title>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const permissions = {
                read: formData.get('read') === 'all' ? ['all'] : (formData.get('readUsers') as string).split(',').map(p => p.trim()),
                write: (formData.get('writeUsers') as string).split(',').map(p => p.trim()).filter(p => p),
                delete: (formData.get('deleteUsers') as string).split(',').map(p => p.trim()).filter(p => p),
              };
              handleUpdatePermissions(permissions);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">읽기 권한</label>
                <select
                  name="read"
                  defaultValue={selectedDocument?.permissions.read.includes('all') ? 'all' : 'specific'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">모든 사용자</option>
                  <option value="specific">특정 사용자만</option>
                </select>
                <input
                  name="readUsers"
                  type="text"
                  defaultValue={selectedDocument?.permissions.read.filter(p => p !== 'all').join(', ')}
                  placeholder="사용자 ID를 쉼표로 구분"
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">쓰기 권한 (사용자 ID, 쉼표로 구분)</label>
                <input
                  name="writeUsers"
                  type="text"
                  defaultValue={selectedDocument?.permissions.write.join(', ')}
                  placeholder="예: user1,user2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">삭제 권한 (사용자 ID, 쉼표로 구분)</label>
                <input
                  name="deleteUsers"
                  type="text"
                  defaultValue={selectedDocument?.permissions.delete.join(', ')}
                  placeholder="예: admin,user1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default Documents;