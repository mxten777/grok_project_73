import { useState, useEffect } from 'react';
import {
  userService,
  groupService,
  settingsService,
  logService,
  storageService,
  AdminUser,
  AdminGroup,
  SystemSettings,
  SystemLog
} from '../firebase/adminServices';

export const useUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userList = await userService.getAllUsers();
      setUsers(userList);
      setError(null);
    } catch (err) {
      setError('사용자 목록을 불러오는데 실패했습니다.');
      console.error('사용자 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: Omit<AdminUser, 'id' | 'createdAt'>) => {
    try {
      const userId = await userService.createUser(userData);
      await fetchUsers(); // 목록 새로고침
      return userId;
    } catch (err) {
      setError('사용자 생성에 실패했습니다.');
      throw err;
    }
  };

  const updateUser = async (userId: string, updates: Partial<AdminUser>) => {
    try {
      await userService.updateUser(userId, updates);
      await fetchUsers(); // 목록 새로고침
    } catch (err) {
      setError('사용자 업데이트에 실패했습니다.');
      throw err;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      await fetchUsers(); // 목록 새로고침
    } catch (err) {
      setError('사용자 삭제에 실패했습니다.');
      throw err;
    }
  };

  const updateUserRole = async (userId: string, role: AdminUser['role']) => {
    try {
      await userService.updateUserRole(userId, role);
      await fetchUsers(); // 목록 새로고침
    } catch (err) {
      setError('사용자 권한 변경에 실패했습니다.');
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    updateUserRole,
    refetch: fetchUsers,
  };
};

export const useGroups = () => {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const groupList = await groupService.getAllGroups();
      setGroups(groupList);
      setError(null);
    } catch (err) {
      setError('그룹 목록을 불러오는데 실패했습니다.');
      console.error('그룹 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (groupData: Omit<AdminGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const groupId = await groupService.createGroup(groupData);
      await fetchGroups(); // 목록 새로고침
      return groupId;
    } catch (err) {
      setError('그룹 생성에 실패했습니다.');
      throw err;
    }
  };

  const updateGroup = async (groupId: string, updates: Partial<AdminGroup>) => {
    try {
      await groupService.updateGroup(groupId, updates);
      await fetchGroups(); // 목록 새로고침
    } catch (err) {
      setError('그룹 업데이트에 실패했습니다.');
      throw err;
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await groupService.deleteGroup(groupId);
      await fetchGroups(); // 목록 새로고침
    } catch (err) {
      setError('그룹 삭제에 실패했습니다.');
      throw err;
    }
  };

  const addMemberToGroup = async (groupId: string, userId: string) => {
    try {
      await groupService.addMemberToGroup(groupId, userId);
      await fetchGroups(); // 목록 새로고침
    } catch (err) {
      setError('그룹 멤버 추가에 실패했습니다.');
      throw err;
    }
  };

  const removeMemberFromGroup = async (groupId: string, userId: string) => {
    try {
      await groupService.removeMemberFromGroup(groupId, userId);
      await fetchGroups(); // 목록 새로고침
    } catch (err) {
      setError('그룹 멤버 제거에 실패했습니다.');
      throw err;
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    refetch: fetchGroups,
  };
};

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settingsData = await settingsService.getSettings();
      setSettings(settingsData);
      setError(null);
    } catch (err) {
      setError('시스템 설정을 불러오는데 실패했습니다.');
      console.error('시스템 설정 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (settingsId: string, updates: Partial<SystemSettings>) => {
    try {
      await settingsService.updateSettings(settingsId, updates);
      await fetchSettings(); // 설정 새로고침
    } catch (err) {
      setError('시스템 설정 업데이트에 실패했습니다.');
      throw err;
    }
  };

  const createSettings = async (settingsData: Omit<SystemSettings, 'id' | 'updatedAt'>) => {
    try {
      const settingsId = await settingsService.createSettings(settingsData);
      await fetchSettings(); // 설정 새로고침
      return settingsId;
    } catch (err) {
      setError('시스템 설정 생성에 실패했습니다.');
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    createSettings,
    refetch: fetchSettings,
  };
};

export const useSystemLogs = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async (limitCount: number = 100) => {
    try {
      setLoading(true);
      const logList = await logService.getLogs(limitCount);
      setLogs(logList);
      setError(null);
    } catch (err) {
      setError('시스템 로그를 불러오는데 실패했습니다.');
      console.error('시스템 로그 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUserLogs = async (userId: string, limitCount: number = 50) => {
    try {
      const userLogList = await logService.getUserLogs(userId, limitCount);
      return userLogList;
    } catch (err) {
      setError('사용자 로그를 불러오는데 실패했습니다.');
      throw err;
    }
  };

  const createLog = async (logData: Omit<SystemLog, 'id' | 'timestamp'>) => {
    try {
      const logId = await logService.createLog(logData);
      await fetchLogs(); // 로그 목록 새로고침
      return logId;
    } catch (err) {
      setError('로그 생성에 실패했습니다.');
      throw err;
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return {
    logs,
    loading,
    error,
    fetchLogs,
    getUserLogs,
    createLog,
    refetch: fetchLogs,
  };
};

export const useStorage = () => {
  const [storageInfo, setStorageInfo] = useState<{
    totalSize: number;
    fileCount: number;
    files: unknown[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStorageUsage = async () => {
    try {
      setLoading(true);
      const info = await storageService.getStorageUsage();
      setStorageInfo(info);
      setError(null);
    } catch (err) {
      setError('스토리지 정보를 불러오는데 실패했습니다.');
      console.error('스토리지 정보 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (filePath: string) => {
    try {
      await storageService.deleteFile(filePath);
      await fetchStorageUsage(); // 스토리지 정보 새로고침
    } catch (err) {
      setError('파일 삭제에 실패했습니다.');
      throw err;
    }
  };

  const uploadFile = async (file: File, path: string) => {
    try {
      const downloadURL = await storageService.uploadFile(file, path);
      await fetchStorageUsage(); // 스토리지 정보 새로고침
      return downloadURL;
    } catch (err) {
      setError('파일 업로드에 실패했습니다.');
      throw err;
    }
  };

  useEffect(() => {
    fetchStorageUsage();
  }, []);

  return {
    storageInfo,
    loading,
    error,
    deleteFile,
    uploadFile,
    refetch: fetchStorageUsage,
  };
};