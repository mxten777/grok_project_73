import React, { useState, useEffect, useRef } from 'react';
import { QrCodeIcon, MapPinIcon, ClockIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useAttendance } from '../hooks/useAttendance';
// import { useAuth } from '../hooks/useAuth';
import { Dialog } from '@headlessui/react';
import { BrowserMultiFormatReader } from '@zxing/library';

const Attendance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'calendar' | 'admin'>('checkin');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  // const { user } = useAuth();
  const {
    todayRecord,
    monthlyRecords,
    stats,
    loading,
    checkIn,
    checkOut,
    getCurrentLocation,
    generateQRCode,
    scanQRCode,
  } = useAttendance();

  const today = new Date();

  useEffect(() => {
    // Generate QR code for check-in/check-out only once
    if (!qrCodeData) {
      generateQRCode().then(setQrCodeData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Get current location
    getCurrentLocation().then(setLocation).catch(setLocationError);
  }, [getCurrentLocation]);

  const handleCheckIn = async () => {
    try {
      await checkIn(location || undefined);
      alert('출근 체크인이 완료되었습니다!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '출근 체크인에 실패했습니다.';
      alert(message);
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut(location || undefined);
      alert('퇴근 체크아웃이 완료되었습니다!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '퇴근 체크아웃에 실패했습니다.';
      alert(message);
    }
  };

  const startQRScan = async () => {
    setShowQRScanner(true);

    try {
      codeReader.current = new BrowserMultiFormatReader();
      const result = await codeReader.current.decodeOnceFromVideoDevice(undefined, videoRef.current!);
      const scannedData = result.getText();

      const validation = scanQRCode(scannedData);
      if (validation.isValid) {
        if (validation.type === 'checkin') {
          await handleCheckIn();
        } else {
          await handleCheckOut();
        }
      } else {
        alert('유효하지 않은 QR 코드입니다.');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      alert('QR 코드 스캔에 실패했습니다.');
    } finally {
      setShowQRScanner(false);
      if (codeReader.current) {
        codeReader.current.reset();
      }
    }
  };

  const stopQRScan = () => {
    setShowQRScanner(false);
    if (codeReader.current) {
      codeReader.current.reset();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      case 'early_leave': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateWorkHours = (checkInTime: Date, checkOutTime?: Date) => {
    const endTime = checkOutTime || new Date();
    const diffMs = endTime.getTime() - checkInTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours.toFixed(1);
  };

  const formatWorkHours = (hours: string) => {
    const numHours = parseFloat(hours);
    const wholeHours = Math.floor(numHours);
    const minutes = Math.round((numHours - wholeHours) * 60);
    return `${wholeHours}시간 ${minutes}분`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return '출근';
      case 'absent': return '결근';
      case 'late': return '지각';
      case 'early_leave': return '조퇴';
      default: return '알 수 없음';
    }
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
        <h1 className="text-2xl font-bold text-gray-900">근태관리</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'checkin' as const, name: '출퇴근 체크', icon: ClockIcon },
            { id: 'calendar' as const, name: '근태 캘린더', icon: CalendarIcon },
            { id: 'admin' as const, name: '관리자', icon: UserGroupIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Check-in Tab */}
      {activeTab === 'checkin' && (
        <div className="space-y-6">
          {/* Today's Status */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">오늘의 근태</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {todayRecord?.checkInTime ? formatTime(todayRecord.checkInTime) : '--:--'}
                  </div>
                  <div className="text-sm text-gray-500">출근 시간</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {todayRecord?.checkOutTime ? formatTime(todayRecord.checkOutTime) : '--:--'}
                  </div>
                  <div className="text-sm text-gray-500">퇴근 시간</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {todayRecord?.checkInTime
                      ? formatWorkHours(calculateWorkHours(todayRecord.checkInTime, todayRecord?.checkOutTime))
                      : '--시간 --분'
                    }
                  </div>
                  <div className="text-sm text-gray-500">근무 시간</div>
                </div>
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(todayRecord?.status || 'absent')}`}>
                    {getStatusText(todayRecord?.status || 'absent')}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">상태</div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Info */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" />
                위치 정보
              </h2>
            </div>
            <div className="p-6">
              {location ? (
                <div className="text-sm text-gray-600">
                  <p>위도: {location.latitude.toFixed(6)}</p>
                  <p>경도: {location.longitude.toFixed(6)}</p>
                  {location.accuracy && <p>정확도: ±{location.accuracy.toFixed(0)}m</p>}
                </div>
              ) : (
                <p className="text-gray-500">{locationError || '위치 정보를 가져오는 중...'}</p>
              )}
            </div>
          </div>

          {/* Check-in/out Buttons */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">출퇴근 체크</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCheckIn}
                  disabled={!!todayRecord?.checkInTime}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                >
                  <ClockIcon className="h-5 w-5 mr-2" />
                  출근 체크인
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!todayRecord?.checkInTime || !!todayRecord?.checkOutTime}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <ClockIcon className="h-5 w-5 mr-2" />
                  퇴근 체크아웃
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={startQRScan}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <QrCodeIcon className="h-5 w-5 mr-2" />
                  QR 코드로 체크인/아웃
                </button>
              </div>
            </div>
          </div>

          {/* QR Code Display */}
          {qrCodeData && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">QR 코드</h2>
              </div>
              <div className="p-6 text-center">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img src={qrCodeData} alt="QR Code" className="w-48 h-48" />
                </div>
                <p className="mt-2 text-sm text-gray-500">QR 코드를 스캔하여 출퇴근을 기록하세요</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {today.getFullYear()}년 {today.getMonth() + 1}월 근태 현황
            </h2>
          </div>
          <div className="p-6">
            {/* Monthly Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{stats?.presentDays || 0}</div>
                <div className="text-sm text-gray-500">출근일</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{(stats?.presentDays || 0) * 8}</div>
                <div className="text-sm text-gray-500">총 근무시간</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats?.absentDays || 0}</div>
                <div className="text-sm text-gray-500">결근일</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats?.lateDays || 0}</div>
                <div className="text-sm text-gray-500">지각일</div>
              </div>
            </div>

            {/* Daily Records */}
            <div className="space-y-2">
              {monthlyRecords.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">
                      {record.date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {getStatusText(record.status)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {record.checkInTime && record.checkOutTime
                      ? `${formatTime(record.checkInTime)} - ${formatTime(record.checkOutTime)}`
                      : record.checkInTime
                      ? `${formatTime(record.checkInTime)} - `
                      : '미체크인'
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Tab */}
      {activeTab === 'admin' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">관리자 기능</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500">관리자 기능은 추후 구현 예정입니다.</p>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <Dialog open={showQRScanner} onClose={stopQRScan} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                QR 코드 스캔
              </Dialog.Title>
              <button
                onClick={stopQRScan}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-100 rounded-lg"
                autoPlay
                muted
                playsInline
              />
              <p className="mt-4 text-sm text-gray-500 text-center">
                카메라를 QR 코드에 가까이 대세요
              </p>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default Attendance;