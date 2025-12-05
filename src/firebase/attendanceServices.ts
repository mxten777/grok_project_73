import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './config';

export interface AttendanceRecord {
  id?: string;
  userId: string;
  userName: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'half_day';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  modifiedBy?: string; // 관리자 수정 시 기록
}

export interface AttendanceRecordDoc {
  id: string;
  userId: string;
  userName: string;
  date: string; // ISO string
  checkInTime?: string; // ISO string
  checkOutTime?: string; // ISO string
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'half_day';
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  modifiedBy?: string;
}

// Convert Firestore document to AttendanceRecord
const docToAttendanceRecord = (doc: QueryDocumentSnapshot): AttendanceRecord => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    userName: data.userName,
    date: new Date(data.date),
    checkInTime: data.checkInTime ? new Date(data.checkInTime) : undefined,
    checkOutTime: data.checkOutTime ? new Date(data.checkOutTime) : undefined,
    location: data.location,
    status: data.status,
    notes: data.notes,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    modifiedBy: data.modifiedBy,
  };
};

// Convert AttendanceRecord to Firestore document
const attendanceRecordToDoc = (record: Omit<AttendanceRecord, 'id'>): Omit<AttendanceRecordDoc, 'id'> => {
  return {
    userId: record.userId,
    userName: record.userName,
    date: record.date.toISOString(),
    checkInTime: record.checkInTime?.toISOString(),
    checkOutTime: record.checkOutTime?.toISOString(),
    location: record.location,
    status: record.status,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    modifiedBy: record.modifiedBy,
  };
};

// Check in (출근)
export const checkIn = async (
  userId: string,
  userName: string,
  location?: { latitude: number; longitude: number; accuracy?: number }
): Promise<string> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingRecords = await getUserAttendanceForDate(userId, today);
    if (existingRecords.length > 0 && existingRecords[0].checkInTime) {
      throw new Error('이미 오늘 출근 체크인을 완료했습니다.');
    }

    const record: Omit<AttendanceRecord, 'id'> = {
      userId,
      userName,
      date: today,
      checkInTime: new Date(),
      location,
      status: 'present',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'attendance'), attendanceRecordToDoc(record));
    return docRef.id;
  } catch (error) {
    console.error('Error checking in:', error);
    throw error;
  }
};

// Check out (퇴근)
export const checkOut = async (
  userId: string,
  location?: { latitude: number; longitude: number; accuracy?: number }
): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecords = await getUserAttendanceForDate(userId, today);
    if (existingRecords.length === 0) {
      throw new Error('오늘 출근 기록이 없습니다.');
    }

    const record = existingRecords[0];
    if (record.checkOutTime) {
      throw new Error('이미 퇴근 체크아웃을 완료했습니다.');
    }

    const docRef = doc(db, 'attendance', record.id!);
    await updateDoc(docRef, {
      checkOutTime: new Date().toISOString(),
      location: location || record.location,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking out:', error);
    throw error;
  }
};

// Get user's attendance for a specific date
export const getUserAttendanceForDate = async (userId: string, date: Date): Promise<AttendanceRecord[]> => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'attendance'),
      where('userId', '==', userId),
      where('date', '>=', startOfDay.toISOString()),
      where('date', '<=', endOfDay.toISOString())
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToAttendanceRecord);
  } catch (error) {
    console.error('Error getting user attendance for date:', error);
    throw error;
  }
};

// Get user's attendance for a month
export const getUserAttendanceForMonth = async (userId: string, year: number, month: number): Promise<AttendanceRecord[]> => {
  try {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'attendance'),
      where('userId', '==', userId),
      where('date', '>=', startOfMonth.toISOString()),
      where('date', '<=', endOfMonth.toISOString()),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToAttendanceRecord);
  } catch (error) {
    console.error('Error getting user attendance for month:', error);
    throw error;
  }
};

// Get all users' attendance for a date (admin)
export const getAllAttendanceForDate = async (date: Date): Promise<AttendanceRecord[]> => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'attendance'),
      where('date', '>=', startOfDay.toISOString()),
      where('date', '<=', endOfDay.toISOString()),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToAttendanceRecord);
  } catch (error) {
    console.error('Error getting all attendance for date:', error);
    throw error;
  }
};

// Update attendance record (admin)
export const updateAttendanceRecord = async (
  recordId: string,
  updates: Partial<Pick<AttendanceRecord, 'checkInTime' | 'checkOutTime' | 'status' | 'notes'>>,
  modifiedBy: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'attendance', recordId);
    const updateData: Partial<AttendanceRecordDoc> = {
      updatedAt: new Date().toISOString(),
      modifiedBy,
    };

    if (updates.checkInTime !== undefined) updateData.checkInTime = updates.checkInTime.toISOString();
    if (updates.checkOutTime !== undefined) updateData.checkOutTime = updates.checkOutTime.toISOString();
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
};

// Calculate working hours
export const calculateWorkingHours = (checkInTime: Date, checkOutTime: Date): number => {
  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // hours with 2 decimal places
};

// Get attendance statistics for a user in a month
export const getAttendanceStats = async (userId: string, year: number, month: number) => {
  try {
    const records = await getUserAttendanceForMonth(userId, year, month);

    let totalWorkingHours = 0;
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let earlyLeaveDays = 0;

    records.forEach(record => {
      if (record.checkInTime && record.checkOutTime) {
        totalWorkingHours += calculateWorkingHours(record.checkInTime, record.checkOutTime);
      }

      switch (record.status) {
        case 'present':
          presentDays++;
          break;
        case 'absent':
          absentDays++;
          break;
        case 'late':
          lateDays++;
          break;
        case 'early_leave':
          earlyLeaveDays++;
          break;
      }
    });

    return {
      totalWorkingHours,
      presentDays,
      absentDays,
      lateDays,
      earlyLeaveDays,
      totalRecords: records.length,
    };
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    throw error;
  }
};

// Generate QR code data for check-in/check-out
export const generateQRCodeData = (type: 'checkin' | 'checkout', userId: string): string => {
  const timestamp = Date.now();
  const data = {
    type,
    userId,
    timestamp,
    validUntil: timestamp + (5 * 60 * 1000), // 5 minutes validity
  };
  return JSON.stringify(data);
};

// Validate QR code data
export const validateQRCodeData = (qrData: string): { type: 'checkin' | 'checkout'; userId: string; isValid: boolean } => {
  try {
    const data = JSON.parse(qrData);
    const now = Date.now();

    if (data.validUntil && now > data.validUntil) {
      return { type: data.type, userId: data.userId, isValid: false };
    }

    return { type: data.type, userId: data.userId, isValid: true };
  } catch {
    return { type: 'checkin', userId: '', isValid: false };
  }
};