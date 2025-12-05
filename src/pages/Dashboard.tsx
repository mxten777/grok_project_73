import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const Dashboard: React.FC = () => {
  // 샘플 데이터
  const attendanceData = [
    { name: '월', 출근: 45, 결근: 2 },
    { name: '화', 출근: 48, 결근: 1 },
    { name: '수', 출근: 46, 결근: 3 },
    { name: '목', 출근: 47, 결근: 2 },
    { name: '금', 출근: 44, 결근: 1 },
  ];

  const projectData = [
    { name: '진행중', value: 8, color: '#3B82F6' },
    { name: '완료', value: 12, color: '#10B981' },
    { name: '대기', value: 3, color: '#F59E0B' },
    { name: '취소', value: 1, color: '#EF4444' },
  ];

  const approvalData = [
    { month: '1월', 승인: 45, 거절: 3, 대기: 12 },
    { month: '2월', 승인: 52, 거절: 2, 대기: 8 },
    { month: '3월', 승인: 48, 거절: 4, 대기: 15 },
    { month: '4월', 승인: 55, 거절: 1, 대기: 10 },
    { month: '5월', 승인: 50, 거절: 3, 대기: 9 },
    { month: '6월', 승인: 58, 거절: 2, 대기: 7 },
  ];
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">일</span>
                </div>
              </div>
              <div className="ml-5 flex-1 min-w-0">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">오늘 일정</dt>
                  <dd className="text-lg font-medium text-gray-900">3</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">결</span>
                </div>
              </div>
              <div className="ml-5 flex-1 min-w-0">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">결재 대기</dt>
                  <dd className="text-lg font-medium text-gray-900">5</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">공</span>
                </div>
              </div>
              <div className="ml-5 flex-1 min-w-0">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">공지</dt>
                  <dd className="text-lg font-medium text-gray-900">2</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">메</span>
                </div>
              </div>
              <div className="ml-5 flex-1 min-w-0">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">미확인 메시지</dt>
                  <dd className="text-lg font-medium text-gray-900">12</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">To-Do 리스트</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600">보고서 작성</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      완료
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      마감일: 2025-12-10
                    </p>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600">회의 준비</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      진행중
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      마감일: 2025-12-12
                    </p>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">분석 차트</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 출근 현황 차트 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-md font-medium text-gray-900 mb-4">주간 출근 현황</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="출근" fill="#3B82F6" />
                <Bar dataKey="결근" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 프로젝트 현황 차트 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-md font-medium text-gray-900 mb-4">프로젝트 현황</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 결재 추이 차트 */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h3 className="text-md font-medium text-gray-900 mb-4">결재 현황 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={approvalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="승인" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="거절" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="대기" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;