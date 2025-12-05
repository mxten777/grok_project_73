import { useState, useEffect, useCallback } from 'react';
import type { Notice } from '../firebase/noticeServices';
import {
  createNotice as apiCreateNotice,
  getPublishedNotices,
  markNoticeAsRead,
  getUnreadNoticesCount,
  subscribeToPublishedNotices,
} from '../firebase/noticeServices';
import { useAuth } from './useAuth';

export const useNotices = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user } = useAuth();

  // Load published notices
  const loadNotices = useCallback(async () => {
    try {
      setLoading(true);
      const publishedNotices = await getPublishedNotices();
      setNotices(publishedNotices);
    } catch (err) {
      console.error('Error loading notices:', err);
      setError('공지사항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const count = await getUnreadNoticesCount(user.uid);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToPublishedNotices((updatedNotices) => {
      setNotices(updatedNotices);
      if (user) {
        loadUnreadCount();
      }
    });

    return () => unsubscribe();
  }, [user, loadUnreadCount]);

  // Load initial data
  useEffect(() => {
    loadNotices();
    if (user) {
      loadUnreadCount();
    }
  }, [loadNotices, loadUnreadCount, user]);

  // Create a new notice
  const createNotice = async (noticeData: Omit<Notice, 'id'>) => {
    try {
      setError(null);
      await apiCreateNotice(noticeData);
      // Refresh notices if the new notice is published
      if (noticeData.isPublished) {
        await loadNotices();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '공지사항 생성에 실패했습니다.');
      throw err;
    }
  };

  // Mark notice as read
  const markAsRead = async (noticeId: string, userId: string) => {
    try {
      setError(null);
      await markNoticeAsRead(noticeId, userId);
      // Update local state
      setNotices(prevNotices =>
        prevNotices.map(notice =>
          notice.id === noticeId
            ? { ...notice, readBy: [...(notice.readBy || []), userId] }
            : notice
        )
      );
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '읽음 처리에 실패했습니다.');
      throw err;
    }
  };

  // Get unread count
  const getUnreadCount = () => {
    return unreadCount;
  };

  // Refresh data
  const refresh = () => {
    loadNotices();
    if (user) {
      loadUnreadCount();
    }
  };

  return {
    notices,
    loading,
    error,
    unreadCount,
    createNotice,
    markAsRead,
    getUnreadCount,
    refresh,
    clearError: () => setError(null),
  };
};