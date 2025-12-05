import React, { useState } from 'react';
import { useSystemLogs } from '../../hooks/useAdmin';

const LogsMonitoring: React.FC = () => {
  const { logs, loading, error, fetchLogs } = useSystemLogs();
  const [filter, setFilter] = useState({
    action: '',
    userId: '',
    dateRange: 'today', // today, week, month, all
  });

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(timestamp);
  };

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'text-green-600 bg-green-100';
    if (action.includes('update') || action.includes('edit')) return 'text-blue-600 bg-blue-100';
    if (action.includes('delete') || action.includes('remove')) return 'text-red-600 bg-red-100';
    if (action.includes('login') || action.includes('auth')) return 'text-purple-600 bg-purple-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getActionLabel = (action: string) => {
    const actionMap: { [key: string]: string } = {
      'user_create': '사용자 생성',
      'user_update': '사용자 수정',
      'user_delete': '사용자 삭제',
      'group_create': '그룹 생성',
      'group_update': '그룹 수정',
      'group_delete': '그룹 삭제',
      'login': '로그인',
      'logout': '로그아웃',
      'file_upload': '파일 업로드',
      'file_delete': '파일 삭제',
      'notice_create': '공지사항 생성',
      'notice_update': '공지사항 수정',
      'approval_create': '결재 생성',
      'approval_approve': '결재 승인',
      'attendance_check': '출근 체크',
    };
    return actionMap[action] || action;
  };

  const filteredLogs = logs.filter(log => {
    if (filter.action && !log.action.includes(filter.action)) return false;
    if (filter.userId && log.userId !== filter.userId) return false;

    const now = new Date();
    const logDate = log.timestamp;

    switch (filter.dateRange) {
      case 'today':
        return logDate.toDateString() === now.toDateString();
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return logDate >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return logDate >= monthAgo;
      }
      default:
        return true;
    }
  });

  const handleLoadMore = () => {
    fetchLogs(logs.length + 100);
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
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
        <h2 className="text-xl font-semibold text-gray-900">로그 모니터링</h2>
        <p className="mt-1 text-sm text-gray-600">시스템 활동 로그를 확인하세요</p>
      </div>

      {/* 필터 */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">액션</label>
            <select
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체</option>
              <option value="user">사용자 관련</option>
              <option value="group">그룹 관련</option>
              <option value="login">로그인</option>
              <option value="file">파일 관련</option>
              <option value="notice">공지사항</option>
              <option value="approval">결재</option>
              <option value="attendance">근태</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">기간</label>
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">오늘</option>
              <option value="week">1주일</option>
              <option value="month">1개월</option>
              <option value="all">전체</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">사용자 ID</label>
            <input
              type="text"
              value={filter.userId}
              onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="사용자 ID 입력"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => fetchLogs(100)}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 로그 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredLogs.map((log) => (
            <li key={log.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className="ml-3 text-sm text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">사용자:</span> {log.userId}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">리소스:</span> {log.resource}
                    </p>
                    {log.details && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-500 cursor-pointer">상세 정보</summary>
                        <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  {log.ipAddress && <p>IP: {log.ipAddress}</p>}
                  {log.userAgent && (
                    <p className="truncate max-w-xs" title={log.userAgent}>
                      {log.userAgent.substring(0, 30)}...
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">로그가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 더 보기 버튼 */}
      {logs.length >= 100 && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            더 보기
          </button>
        </div>
      )}

      {/* 통계 요약 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
          <div className="text-sm text-gray-500">총 로그 수</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {logs.filter(log => log.action.includes('create') || log.action.includes('add')).length}
          </div>
          <div className="text-sm text-gray-500">생성 액션</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {logs.filter(log => log.action.includes('update') || log.action.includes('edit')).length}
          </div>
          <div className="text-sm text-gray-500">수정 액션</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {logs.filter(log => log.action.includes('delete') || log.action.includes('remove')).length}
          </div>
          <div className="text-sm text-gray-500">삭제 액션</div>
        </div>
      </div>
    </div>
  );
};

export default LogsMonitoring;