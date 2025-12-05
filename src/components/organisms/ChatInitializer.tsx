import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../firebase/services';

const ChatInitializer: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    const initializeChats = async () => {
      if (!user) return;

      try {
        // Check if user already has chats
        const existingChats = await chatService.getUserChats(user.uid);
        if (existingChats.length > 0) return;

        // Create sample chats for demo
        const sampleChats = [
          {
            type: 'direct' as const,
            participants: [user.uid, 'sample-user-1'],
            name: '홍길동',
            createdBy: user.uid,
            permissions: [],
          },
          {
            type: 'group' as const,
            participants: [user.uid, 'sample-user-1', 'sample-user-2'],
            name: '프로젝트 팀',
            createdBy: user.uid,
            permissions: [],
          },
          {
            type: 'notice' as const,
            participants: [user.uid, 'sample-user-1', 'sample-user-2', 'sample-user-3'],
            name: '공지사항',
            createdBy: user.uid,
            permissions: [],
          },
        ];

        for (const chatData of sampleChats) {
          await chatService.createChat(chatData);
        }

        console.log('Sample chats created for demo');
      } catch (error) {
        console.error('Error initializing chats:', error);
      }
    };

    initializeChats();
  }, [user]);

  return null; // This component doesn't render anything
};

export default ChatInitializer;