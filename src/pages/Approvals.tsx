import React, { useState, useEffect } from 'react';
import { DocumentTextIcon, PlusIcon, ClockIcon, CheckCircleIcon, XCircleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import VacationApprovalForm from '../components/organisms/VacationApprovalForm';
import { useAuth } from '../hooks/useAuth';
import { useApprovals } from '../hooks/useApprovals';
import { generateApprovalPDF, downloadPDF } from '../utils/pdfUtils';

const Approvals: React.FC = () => {
  const { user } = useAuth();
  const {
    pendingApprovals,
    myRequests,
    approvalHistory,
    loading,
    processApproval,
  } = useApprovals();
  const [showNewApproval, setShowNewApproval] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'my-requests' | 'history'>('pending');

  const approvalTemplates = [
    { id: 'vacation', name: '휴가 신청서', icon: '🏖️', description: '연차/반차 휴가 신청' },
    { id: 'expense', name: '지출 결의서', icon: '💰', description: '비용 지출 승인 요청' },
    { id: 'purchase', name: '구매 요청서', icon: '🛒', description: '물품/서비스 구매 승인' },
    { id: 'quote', name: '견적서 승인', icon: '📋', description: '거래처 견적 승인' },
    { id: 'contract', name: '계약서 승인', icon: '📄', description: '계약 체결 승인' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'reviewing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewing': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '임시저장';
      case 'submitted': return '상신';
      case 'reviewing': return '검토중';
      case 'approved': return '승인';
      case 'rejected': return '반려';
      default: return '알 수 없음';
    }
  };

  const getApprovalTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      vacation: '휴가 신청서',
      expense: '지출 결의서',
      purchase: '구매 요청서',
      quote: '견적서 승인',
      contract: '계약서 승인',
    };
    return typeMap[type] || type;
  };

  const handleApprove = async (approvalId: string) => {
    if (!confirm('이 결재를 승인하시겠습니까?')) return;

    try {
      await processApproval(approvalId, 'approved');
      alert('결재가 승인되었습니다.');
    } catch (error) {
      console.error('승인 처리 실패:', error);
      alert('승인 처리에 실패했습니다.');
    }
  };

  const handleReject = async (approvalId: string) => {
    const comment = prompt('반려 사유를 입력해주세요:');
    if (comment === null) return; // Cancelled

    try {
      await processApproval(approvalId, 'rejected', comment);
      alert('결재가 반려되었습니다.');
    } catch (error) {
      console.error('반려 처리 실패:', error);
      alert('반려 처리에 실패했습니다.');
    }
  };

  const handleDownloadPDF = async (approval: any) => {
    try {
      const pdfBlob = await generateApprovalPDF(approval);
      const filename = `${approval.title}_${approval.id}.pdf`;
      downloadPDF(pdfBlob, filename);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다.');
    }
  };

  const handleCloseForm = () => {
    setSelectedTemplate(null);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">전자결재</h1>
        <button
          onClick={() => setShowNewApproval(!showNewApproval)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          새 결재 작성
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              결재 대기
            </button>
            <button
              onClick={() => setActiveTab('my-requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              내 결재
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              결재 이력
            </button>
          </nav>
        </div>
      </div>

      {showNewApproval && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">결재 양식 선택</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvalTemplates.map((template) => (
                <button
                  key={template.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{template.icon}</div>
                    <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {activeTab === 'pending' && '결재 대기 목록'}
            {activeTab === 'my-requests' && '내 결재 목록'}
            {activeTab === 'history' && '결재 이력'}
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {(activeTab === 'pending' ? pendingApprovals :
            activeTab === 'my-requests' ? myRequests :
            approvalHistory)
            .filter((approval) => {
              if (activeTab === 'pending') return approval.status === 'submitted' || approval.status === 'reviewing';
              if (activeTab === 'my-requests') return true; // 실제로는 현재 사용자의 결재만 필터링
              if (activeTab === 'history') return approval.status === 'approved' || approval.status === 'rejected';
              return true;
            })
            .map((approval) => (
            <li key={approval.id}>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(approval.status)}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{getApprovalTypeText(approval.type)}</p>
                      <p className="text-sm text-gray-500">신청자: {approval.requesterId}</p>
                      {approval.data && (approval.data as any).amount && (
                        <p className="text-sm text-gray-500">금액: {(approval.data as any).amount}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(approval.status)}`}>
                      {getStatusText(approval.status)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadPDF(approval)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="PDF 다운로드"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                      {activeTab === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(approval.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(approval.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            반려
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
            ))}
        </ul>
        {pendingApprovals.filter((approval) => {
          if (activeTab === 'pending') return approval.status === 'submitted' || approval.status === 'reviewing';
          if (activeTab === 'my-requests') return true;
          if (activeTab === 'history') return approval.status === 'approved' || approval.status === 'rejected';
          return true;
        }).length === 0 && (
          <div className="px-6 py-8 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {activeTab === 'pending' && '결재 대기 항목이 없습니다'}
              {activeTab === 'my-requests' && '제출한 결재가 없습니다'}
              {activeTab === 'history' && '결재 이력이 없습니다'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'pending' && '다른 결재를 기다리고 있습니다.'}
              {activeTab === 'my-requests' && '새 결재를 작성해보세요.'}
              {activeTab === 'history' && '완료된 결재가 여기에 표시됩니다.'}
            </p>
          </div>
        )}
      </div>

      {/* 결재 작성 폼 모달 */}
      {selectedTemplate === 'vacation' && (
        <VacationApprovalForm onClose={handleCloseForm} />
      )}
    </div>
  );
};

export default Approvals;