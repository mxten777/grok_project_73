import { db, storage } from './config';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

// 사용자 관리 인터페이스
export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'user';
  department: string;
  position: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  avatar?: string;
}

// 그룹 관리 인터페이스
export interface AdminGroup {
  id: string;
  name: string;
  description: string;
  members: string[]; // 사용자 ID 배열
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 시스템 설정 인터페이스
export interface SystemSettings {
  id: string;
  companyName: string;
  companyLogo?: string;
  allowRegistration: boolean;
  defaultUserRole: 'admin' | 'manager' | 'user';
  features: {
    chat: boolean;
    approval: boolean;
    attendance: boolean;
    calendar: boolean;
    notices: boolean;
    projects: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  updatedAt: Date;
}

// 로그 인터페이스
export interface SystemLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// 사용자 관리 서비스
export const userService = {
  // 모든 사용자 조회
  async getAllUsers(): Promise<AdminUser[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastLoginAt: doc.data().lastLoginAt?.toDate(),
      })) as AdminUser[];
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      throw error;
    }
  },

  // 사용자 생성
  async createUser(userData: Omit<AdminUser, 'id' | 'createdAt'>): Promise<string> {
    try {
      const usersRef = collection(db, 'users');
      const docRef = await addDoc(usersRef, {
        ...userData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('사용자 생성 실패:', error);
      throw error;
    }
  },

  // 사용자 업데이트
  async updateUser(userId: string, updates: Partial<AdminUser>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('사용자 업데이트 실패:', error);
      throw error;
    }
  },

  // 사용자 삭제
  async deleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      throw error;
    }
  },

  // 사용자 권한 변경
  async updateUserRole(userId: string, role: AdminUser['role']): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('사용자 권한 변경 실패:', error);
      throw error;
    }
  },
};

// 그룹 관리 서비스
export const groupService = {
  // 모든 그룹 조회
  async getAllGroups(): Promise<AdminGroup[]> {
    try {
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as AdminGroup[];
    } catch (error) {
      console.error('그룹 목록 조회 실패:', error);
      throw error;
    }
  },

  // 그룹 생성
  async createGroup(groupData: Omit<AdminGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const groupsRef = collection(db, 'groups');
      const docRef = await addDoc(groupsRef, {
        ...groupData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('그룹 생성 실패:', error);
      throw error;
    }
  },

  // 그룹 업데이트
  async updateGroup(groupId: string, updates: Partial<AdminGroup>): Promise<void> {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('그룹 업데이트 실패:', error);
      throw error;
    }
  },

  // 그룹 삭제
  async deleteGroup(groupId: string): Promise<void> {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await deleteDoc(groupRef);
    } catch (error) {
      console.error('그룹 삭제 실패:', error);
      throw error;
    }
  },

  // 그룹에 멤버 추가
  async addMemberToGroup(groupId: string, userId: string): Promise<void> {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      const currentMembers = groupDoc.data()?.members || [];

      if (!currentMembers.includes(userId)) {
        await updateDoc(groupRef, {
          members: [...currentMembers, userId],
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('그룹 멤버 추가 실패:', error);
      throw error;
    }
  },

  // 그룹에서 멤버 제거
  async removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      const currentMembers = groupDoc.data()?.members || [];

      await updateDoc(groupRef, {
        members: currentMembers.filter((id: string) => id !== userId),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('그룹 멤버 제거 실패:', error);
      throw error;
    }
  },
};

// 시스템 설정 서비스
export const settingsService = {
  // 시스템 설정 조회
  async getSettings(): Promise<SystemSettings | null> {
    try {
      const settingsRef = collection(db, 'settings');
      const q = query(settingsRef, limit(1));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as SystemSettings;
      }
      return null;
    } catch (error) {
      console.error('시스템 설정 조회 실패:', error);
      throw error;
    }
  },

  // 시스템 설정 업데이트
  async updateSettings(settingsId: string, updates: Partial<SystemSettings>): Promise<void> {
    try {
      const settingsRef = doc(db, 'settings', settingsId);
      await updateDoc(settingsRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('시스템 설정 업데이트 실패:', error);
      throw error;
    }
  },

  // 시스템 설정 생성 (최초 설정)
  async createSettings(settingsData: Omit<SystemSettings, 'id' | 'updatedAt'>): Promise<string> {
    try {
      const settingsRef = collection(db, 'settings');
      const docRef = await addDoc(settingsRef, {
        ...settingsData,
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('시스템 설정 생성 실패:', error);
      throw error;
    }
  },
};

// 로그 모니터링 서비스
export const logService = {
  // 시스템 로그 조회
  async getLogs(limitCount: number = 100): Promise<SystemLog[]> {
    try {
      const logsRef = collection(db, 'logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as SystemLog[];
    } catch (error) {
      console.error('로그 조회 실패:', error);
      throw error;
    }
  },

  // 로그 생성
  async createLog(logData: Omit<SystemLog, 'id' | 'timestamp'>): Promise<string> {
    try {
      const logsRef = collection(db, 'logs');
      const docRef = await addDoc(logsRef, {
        ...logData,
        timestamp: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('로그 생성 실패:', error);
      throw error;
    }
  },

  // 사용자별 로그 조회
  async getUserLogs(userId: string, limitCount: number = 50): Promise<SystemLog[]> {
    try {
      const logsRef = collection(db, 'logs');
      const q = query(
        logsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as SystemLog[];
    } catch (error) {
      console.error('사용자 로그 조회 실패:', error);
      throw error;
    }
  },
};

// 스토리지 관리 서비스
export const storageService = {
  // 스토리지 사용량 조회
  async getStorageUsage(): Promise<{ totalSize: number; fileCount: number; files: unknown[] }> {
    try {
      const storageRef = ref(storage, '');
      const result = await listAll(storageRef);

      const totalSize = 0;
      const files: Array<{
        name: string;
        size: number;
        type: string;
        updated: string;
      }> = [];

      for (const item of result.items) {
        try {
          // const metadata = await item.getMetadata();
          // For now, skip metadata to avoid Firebase v12 compatibility issues
          // totalSize += metadata.size;
          files.push({
            name: item.name,
            size: 0, // metadata.size,
            type: 'unknown', // metadata.contentType,
            updated: new Date().toISOString(), // metadata.updated,
          });
        } catch (error) {
          console.warn(`파일 메타데이터 조회 실패: ${item.name}`, error);
        }
      }

      return { totalSize, fileCount: files.length, files };
    } catch (error) {
      console.error('스토리지 사용량 조회 실패:', error);
      throw error;
    }
  },

  // 파일 삭제
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      throw error;
    }
  },

  // 파일 업로드
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const fileRef = ref(storage, path);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      throw error;
    }
  },
};