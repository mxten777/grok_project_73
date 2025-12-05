import React, { useState } from 'react';
import { useStorage } from '../../hooks/useAdmin';

const StorageManagement: React.FC = () => {
  const { storageInfo, loading, error, deleteFile, uploadFile } = useStorage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPath, setUploadPath] = useState('');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('document') || type.includes('word')) return '📝';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    return '📁';
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadPath) {
      alert('파일과 업로드 경로를 선택해주세요.');
      return;
    }

    try {
      await uploadFile(selectedFile, uploadPath);
      setSelectedFile(null);
      setUploadPath('');
      alert('파일이 업로드되었습니다.');
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      alert('파일 업로드에 실패했습니다.');
    }
  };

  const handleFileDelete = async (filePath: string) => {
    if (!confirm('정말로 이 파일을 삭제하시겠습니까?')) return;

    try {
      await deleteFile(filePath);
      alert('파일이 삭제되었습니다.');
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      alert('파일 삭제에 실패했습니다.');
    }
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
        <h2 className="text-xl font-semibold text-gray-900">스토리지 관리</h2>
        <p className="mt-1 text-sm text-gray-600">Firebase Storage의 파일을 관리하세요</p>
      </div>

      {/* 스토리지 통계 */}
      {storageInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-3xl font-bold text-blue-600">{storageInfo.fileCount}</div>
            <div className="text-sm text-gray-500">총 파일 수</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-3xl font-bold text-green-600">{formatFileSize(storageInfo.totalSize)}</div>
            <div className="text-sm text-gray-500">총 용량</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-3xl font-bold text-purple-600">
              {storageInfo.fileCount > 0 ? formatFileSize(storageInfo.totalSize / storageInfo.fileCount) : '0 Bytes'}
            </div>
            <div className="text-sm text-gray-500">평균 파일 크기</div>
          </div>
        </div>
      )}

      {/* 파일 업로드 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">파일 업로드</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">업로드 경로</label>
            <input
              type="text"
              value={uploadPath}
              onChange={(e) => setUploadPath(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: documents/readme.txt"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">파일 선택</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile || !uploadPath}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              업로드
            </button>
          </div>
        </div>
      </div>

      {/* 파일 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">파일 목록</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {storageInfo?.files.map((file, index) => {
            const fileData = file as any;
            return (
            <li key={index} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getFileTypeIcon(fileData.type)}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{fileData.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(fileData.size)} • {fileData.type} • {formatDate(fileData.updated)}
                    </div>
                    <div className="text-xs text-gray-400">{fileData.fullPath}</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.open(`https://firebasestorage.googleapis.com/v0/b/${process.env.VITE_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(fileData.fullPath)}?alt=media`, '_blank')}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    보기
                  </button>
                  <button
                    onClick={() => handleFileDelete(fileData.fullPath)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
            );
          })}
        </ul>

        {(!storageInfo?.files || storageInfo.files.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">업로드된 파일이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 파일 타입별 통계 */}
      {storageInfo && storageInfo.files.length > 0 && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">파일 타입별 통계</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(
              storageInfo.files.reduce((acc: Record<string, number>, file) => {
                const fileData = file as any;
                const type = fileData.type.split('/')[0] || 'other';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{String(count)}</div>
                <div className="text-sm text-gray-500 capitalize">{type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageManagement;