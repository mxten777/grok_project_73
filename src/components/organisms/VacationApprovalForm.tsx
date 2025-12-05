import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { approvalService } from '../../firebase/approvalServices';
import type { Approval } from '../../types';

interface VacationFormData {
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  type: 'annual' | 'half-day' | 'sick';
}

interface VacationApprovalFormProps {
  onClose: () => void;
}

const VacationApprovalForm: React.FC<VacationApprovalFormProps> = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VacationFormData>({
    startDate: '',
    endDate: '',
    days: 0,
    reason: '',
    type: 'annual',
  });

  const calculateDays = (start: string, end: string, type: string) => {
    if (!start || !end) return 0;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (type === 'half-day') return 0.5;
    return diffDays;
  };

  const handleInputChange = (field: keyof VacationFormData, value: string | number) => {
    const newData = { ...formData, [field]: value };

    if (field === 'startDate' || field === 'endDate' || field === 'type') {
      newData.days = calculateDays(newData.startDate, newData.endDate, newData.type);
    }

    setFormData(newData);
  };

  const handleSubmit = async (e: React.FormEvent, action: 'draft' | 'submit') => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const approvalData: Omit<Approval, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'vacation',
        requesterId: user.uid,
        status: action === 'draft' ? 'draft' : 'submitted',
        approvers: ['manager-id-1', 'ceo-id-1'], // 실제로는 동적 할당 필요
        currentApprover: action === 'submit' ? 'manager-id-1' : undefined,
        data: {
          vacationType: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          days: formData.days,
          reason: formData.reason,
        },
        pdfUrl: undefined,
        history: [],
        createdBy: user.uid,
        permissions: [],
      };

      const approvalId = await approvalService.createApproval(approvalData);

      if (action === 'submit') {
        await approvalService.submitApproval(approvalId);
      }

      onClose();
      navigate('/approvals');
    } catch (error) {
      console.error('Failed to create approval:', error);
      alert('결재 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">휴가 신청서</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">휴가 유형</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="annual">연차 휴가</option>
                  <option value="half-day">반차</option>
                  <option value="sick">병가</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">휴가 일수</label>
                <input
                  type="number"
                  value={formData.days}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">시작일</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">종료일</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">휴가 사유</label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="휴가 사유를 입력하세요..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                취소
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                임시저장
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'submit')}
                disabled={loading || !formData.startDate || !formData.endDate || !formData.reason}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? '제출중...' : '결재 상신'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VacationApprovalForm;