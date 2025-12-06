import { useState, useEffect, useCallback } from 'react';
import type { AttendanceRecord } from '../firebase/attendanceServices';
import {
  checkIn as apiCheckIn,
  checkOut as apiCheckOut,
  getUserAttendanceForDate,
  getUserAttendanceForMonth,
  generateQRCodeData,
  validateQRCodeData,
} from '../firebase/attendanceServices';
import { useAuth } from './useAuth';
import QRCode from 'qrcode';

export const useAttendance = () => {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<{ totalDays: number; presentDays: number; absentDays: number; lateDays: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Load today's attendance record
  const loadTodayRecord = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const records = await getUserAttendanceForDate(user.uid, today);
      setTodayRecord(records.length > 0 ? records[0] : null);
    } catch (err) {
      console.error('Error loading today record:', err);
      setError('오늘의 근태 기록을 불러오는데 실패했습니다.');
    }
  }, [user]);

  // Load monthly attendance records
  const loadMonthlyRecords = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      const records = await getUserAttendanceForMonth(user.uid, today.getFullYear(), today.getMonth());
      setMonthlyRecords(records);

      // Calculate simple stats
      const totalDays = records.length;
      const presentDays = records.filter(r => r.checkInTime).length;
      const absentDays = totalDays - presentDays;
      const lateDays = records.filter(r => r.status === 'late').length;

      setStats({ totalDays, presentDays, absentDays, lateDays });
    } catch (err) {
      console.error('Error loading monthly records:', err);
      setError('월간 근태 기록을 불러오는데 실패했습니다.');
    }
  }, [user]);

  // Load all attendance data
  const loadAttendanceData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([loadTodayRecord(), loadMonthlyRecords()]);
    } catch (err) {
      console.error('Error loading attendance data:', err);
    } finally {
      setLoading(false);
    }
  }, [loadTodayRecord, loadMonthlyRecords]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  // Check in
  const checkIn = async (location?: { latitude: number; longitude: number; accuracy?: number }) => {
    if (!user) throw new Error('사용자 정보가 없습니다.');

    try {
      setError(null);
      await apiCheckIn(user.uid, user.displayName || user.email || 'Unknown', location);
      await loadTodayRecord(); // Refresh today's record
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '출근 체크인에 실패했습니다.');
      throw err;
    }
  };

  // Check out
  const checkOut = async (location?: { latitude: number; longitude: number; accuracy?: number }) => {
    if (!user) throw new Error('사용자 정보가 없습니다.');

    try {
      setError(null);
      await apiCheckOut(user.uid, location);
      await loadTodayRecord(); // Refresh today's record
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '퇴근 체크아웃에 실패했습니다.');
      throw err;
    }
  };

  // Get current location
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; accuracy?: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('이 브라우저는 위치 정보를 지원하지 않습니다.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let errorMessage = '위치 정보를 가져올 수 없습니다.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '위치 정보 접근이 거부되었습니다.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '위치 정보를 사용할 수 없습니다.';
              break;
            case error.TIMEOUT:
              errorMessage = '위치 정보 요청이 시간 초과되었습니다.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  // Generate QR code for check-in/check-out
  const generateQRCode = useCallback(async (type: 'checkin' | 'checkout' = 'checkin'): Promise<string> => {
    if (!user) throw new Error('사용자 정보가 없습니다.');

    try {
      const qrData = generateQRCodeData(type, user.uid);
      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeUrl;
    } catch (err) {
      console.error('Error generating QR code:', err);
      throw new Error('QR 코드 생성에 실패했습니다.');
    }
  }, [user]);

  // Scan and validate QR code
  const scanQRCode = (qrData: string) => {
    return validateQRCodeData(qrData);
  };

  // Refresh data
  const refresh = () => {
    loadAttendanceData();
  };

  return {
    todayRecord,
    monthlyRecords,
    stats,
    loading,
    error,
    checkIn,
    checkOut,
    getCurrentLocation,
    generateQRCode,
    scanQRCode,
    refresh,
    clearError: () => setError(null),
  };
};