import { useState, useEffect } from 'react';
import { tokenService, notificationService, sendNotification, PushNotification } from '../firebase/notificationServices';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { user: currentUser } = useAuth();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission>(
    () => ('Notification' in window ? Notification.permission : 'default')
  );
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    // 실시간 구독으로 인해 별도 fetch 불필요
  };

  // FCM 메시지 리스너 설정
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = notificationService.setupMessageListener(() => {
      // 새로운 알림이 도착하면 목록을 새로고침
      fetchNotifications();
    });

    return unsubscribe;
  }, [currentUser]);

  // 알림 목록 실시간 구독
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationList: PushNotification[] = [];
      snapshot.forEach((doc) => {
        notificationList.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as PushNotification);
      });

      setNotifications(notificationList);
      setUnreadCount(notificationList.filter(n => !n.read).length);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // 알림 권한 요청
  const requestPermission = async () => {
    try {
      const token = await tokenService.requestPermission();
      if (token && currentUser) {
        await tokenService.saveToken(currentUser.uid, token);
        setPermission('granted');
        return true;
      }
      return false;
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      return false;
    }
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(notification =>
          notificationService.markAsRead(notification.id)
        )
      );
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // 알림 타입별 아이콘 반환
  const getNotificationIcon = (type: PushNotification['type']) => {
    switch (type) {
      case 'chat': return '💬';
      case 'approval': return '📋';
      case 'notice': return '📢';
      case 'calendar': return '📅';
      case 'project': return '🎯';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  // 알림 타입별 색상 반환
  const getNotificationColor = (type: PushNotification['type']) => {
    switch (type) {
      case 'chat': return 'text-blue-600';
      case 'approval': return 'text-orange-600';
      case 'notice': return 'text-purple-600';
      case 'calendar': return 'text-green-600';
      case 'project': return 'text-indigo-600';
      case 'system': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return {
    notifications,
    unreadCount,
    permission,
    loading,
    requestPermission,
    markAsRead,
    markAllAsRead,
    getNotificationIcon,
    getNotificationColor,
  };
};

// 알림 발송을 위한 유틸리티 훅들
export const useSendNotification = () => {
  const sendChatMessage = async (recipientId: string, senderName: string, message: string) => {
    try {
      await sendNotification.chatMessage(recipientId, senderName, message);
    } catch (error) {
      console.error('채팅 메시지 알림 발송 실패:', error);
    }
  };

  const sendApprovalRequest = async (recipientId: string, requesterName: string, approvalType: string) => {
    try {
      await sendNotification.approvalRequest(recipientId, requesterName, approvalType);
    } catch (error) {
      console.error('결재 요청 알림 발송 실패:', error);
    }
  };

  const sendNoticePublished = async (recipientIds: string[], noticeTitle: string, authorName: string) => {
    try {
      await sendNotification.noticePublished(recipientIds, noticeTitle, authorName);
    } catch (error) {
      console.error('공지사항 알림 발송 실패:', error);
    }
  };

  const sendCalendarEvent = async (recipientId: string, eventTitle: string, eventTime: string) => {
    try {
      await sendNotification.calendarEvent(recipientId, eventTitle, eventTime);
    } catch (error) {
      console.error('일정 알림 발송 실패:', error);
    }
  };

  const sendProjectTask = async (recipientId: string, projectName: string, taskTitle: string, action: string) => {
    try {
      await sendNotification.projectTask(recipientId, projectName, taskTitle, action);
    } catch (error) {
      console.error('프로젝트 태스크 알림 발송 실패:', error);
    }
  };

  const sendSystemNotification = async (recipientId: string, title: string, message: string) => {
    try {
      await sendNotification.systemNotification(recipientId, title, message);
    } catch (error) {
      console.error('시스템 알림 발송 실패:', error);
    }
  };

  return {
    sendChatMessage,
    sendApprovalRequest,
    sendNoticePublished,
    sendCalendarEvent,
    sendProjectTask,
    sendSystemNotification,
  };
};