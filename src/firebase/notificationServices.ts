import { messaging } from './config';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, collection } from 'firebase/firestore';
import { db } from './config';

// 알림 인터페이스
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: Record<string, unknown>;
}

export interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'chat' | 'approval' | 'notice' | 'calendar' | 'project' | 'system';
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

// FCM 토큰 관리
export const tokenService = {
  // FCM 토큰 요청 및 저장
  async requestPermission(): Promise<string | null> {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY_HERE' // 실제 VAPID 키로 교체 필요
        });
        return token;
      }
      return null;
    } catch (error) {
      console.error('FCM 토큰 요청 실패:', error);
      return null;
    }
  },

  // 사용자 FCM 토큰 저장
  async saveToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token)
      });
    } catch (error) {
      console.error('FCM 토큰 저장 실패:', error);
      throw error;
    }
  },

  // 사용자 FCM 토큰 제거
  async removeToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(token)
      });
    } catch (error) {
      console.error('FCM 토큰 제거 실패:', error);
      throw error;
    }
  },
};

// 알림 관리 서비스
export const notificationService = {
  // 브라우저 알림 표시
  showNotification(notificationData: NotificationData): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon || '/favicon.ico',
        badge: notificationData.badge,
        tag: notificationData.tag,
        requireInteraction: notificationData.requireInteraction,
        data: notificationData.data,
      });

      // 알림 클릭 이벤트
      notification.onclick = () => {
        // 알림 타입에 따라 적절한 페이지로 이동
        if (notificationData.data?.type) {
          switch (notificationData.data.type) {
            case 'chat':
              window.focus();
              // 채팅 페이지로 이동
              break;
            case 'approval':
              window.location.href = '/approvals';
              break;
            case 'notice':
              window.location.href = '/notices';
              break;
            case 'calendar':
              window.location.href = '/calendar';
              break;
            case 'project':
              window.location.href = '/projects';
              break;
          }
        }
        notification.close();
      };

      // 5초 후 자동 닫기
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  },

  // FCM 메시지 수신 리스너 설정
  setupMessageListener(callback: (payload: MessagePayload) => void): void {
    onMessage(messaging, (payload) => {
      console.log('FCM 메시지 수신:', payload);

      // 브라우저 알림 표시
      if (payload.notification) {
        this.showNotification({
          id: payload.messageId || Date.now().toString(),
          title: payload.notification.title || '새 알림',
          body: payload.notification.body || '',
          icon: payload.notification.icon,
          data: payload.data,
        });
      }

      // 콜백 실행
      callback(payload);
    });
  },

  // 푸시 알림 기록 저장
  async saveNotification(notification: Omit<PushNotification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const notificationRef = doc(collection(db, 'notifications'));
      const notificationData = {
        ...notification,
        id: notificationRef.id,
        createdAt: new Date(),
      };

      await setDoc(notificationRef, notificationData);
      return notificationRef.id;
    } catch (error) {
      console.error('알림 저장 실패:', error);
      throw error;
    }
  },

  // 알림 읽음 처리
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      throw error;
    }
  },
};

// 특정 이벤트에 대한 알림 발송 함수들
export const sendNotification = {
  // 채팅 메시지 알림
  async chatMessage(recipientId: string, senderName: string, message: string): Promise<void> {
    const notification: Omit<PushNotification, 'id' | 'createdAt'> = {
      userId: recipientId,
      title: '새 메시지',
      body: `${senderName}: ${message}`,
      type: 'chat',
      read: false,
      data: { senderName, message },
    };

    await notificationService.saveNotification(notification);
  },

  // 결재 요청 알림
  async approvalRequest(recipientId: string, requesterName: string, approvalType: string): Promise<void> {
    const notification: Omit<PushNotification, 'id' | 'createdAt'> = {
      userId: recipientId,
      title: '결재 요청',
      body: `${requesterName}님이 ${approvalType} 결재를 요청했습니다.`,
      type: 'approval',
      read: false,
      data: { requesterName, approvalType },
    };

    await notificationService.saveNotification(notification);
  },

  // 공지사항 알림
  async noticePublished(recipientIds: string[], noticeTitle: string, authorName: string): Promise<void> {
    const notifications = recipientIds.map(recipientId => ({
      userId: recipientId,
      title: '새 공지사항',
      body: `${authorName}: ${noticeTitle}`,
      type: 'notice' as const,
      read: false,
      data: { noticeTitle, authorName },
    }));

    await Promise.all(
      notifications.map(notification => notificationService.saveNotification(notification))
    );
  },

  // 일정 알림
  async calendarEvent(recipientId: string, eventTitle: string, eventTime: string): Promise<void> {
    const notification: Omit<PushNotification, 'id' | 'createdAt'> = {
      userId: recipientId,
      title: '일정 알림',
      body: `${eventTitle} - ${eventTime}`,
      type: 'calendar',
      read: false,
      data: { eventTitle, eventTime },
    };

    await notificationService.saveNotification(notification);
  },

  // 프로젝트 태스크 알림
  async projectTask(recipientId: string, projectName: string, taskTitle: string, action: string): Promise<void> {
    const notification: Omit<PushNotification, 'id' | 'createdAt'> = {
      userId: recipientId,
      title: '프로젝트 업데이트',
      body: `${projectName}: ${taskTitle} ${action}`,
      type: 'project',
      read: false,
      data: { projectName, taskTitle, action },
    };

    await notificationService.saveNotification(notification);
  },

  // 시스템 알림
  async systemNotification(recipientId: string, title: string, message: string): Promise<void> {
    const notification: Omit<PushNotification, 'id' | 'createdAt'> = {
      userId: recipientId,
      title,
      body: message,
      type: 'system',
      read: false,
      data: { title, message },
    };

    await notificationService.saveNotification(notification);
  },
};