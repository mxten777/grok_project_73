import { useState, useEffect, useCallback } from 'react';
import { chatService, messageService } from '../firebase/services';
import type { Chat, Message } from '../types';
import { useAuth } from './useAuth';

export const useChat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's chats
  const loadChats = useCallback(async () => {
    if (!user?.uid) {
      console.log('useChat: No user uid, skipping loadChats');
      return;
    }

    console.log('useChat: Loading chats for user:', user.uid);
    setLoading(true);
    try {
      const userChats = await chatService.getUserChats(user.uid);
      console.log('useChat: Loaded chats:', userChats);
      setChats(userChats);
    } catch (error) {
      console.error('useChat: Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Subscribe to chat updates
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = chatService.subscribeToChats(user.uid, (updatedChats) => {
      setChats(updatedChats);
    });

    return unsubscribe;
  }, [user?.uid]);

  // Load messages for current chat
  const loadMessages = useCallback(async (chatId: string) => {
    setLoading(true);
    try {
      const chatMessages = await messageService.getMessages(chatId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to message updates
  useEffect(() => {
    if (!currentChat) return;

    const unsubscribe = messageService.subscribeToMessages(currentChat.id, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    return unsubscribe;
  }, [currentChat]);

  // Send message
  const sendMessage = useCallback(async (content: string, type: Message['type'] = 'text', fileUrl?: string) => {
    if (!user?.uid || !currentChat) return;

    try {
      await messageService.sendMessage({
        chatId: currentChat.id,
        senderId: user.uid,
        content,
        type,
        fileUrl,
        reactions: {},
        mentions: [],
        isEdited: false,
        readBy: [],
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [user?.uid, currentChat]);

  // Create new chat
  const createChat = useCallback(async (participants: string[], name?: string, type: Chat['type'] = 'direct') => {
    if (!user?.uid) return;

    try {
      const chatId = await chatService.createChat({
        type,
        participants: [user.uid, ...participants],
        name,
        createdBy: user.uid,
        permissions: [],
      });

      // Load updated chats
      await loadChats();
      return chatId;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }, [user?.uid, loadChats]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!user?.uid) return;

    try {
      await Promise.all(
        messageIds.map(messageId => messageService.markAsRead(messageId, user.uid))
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user?.uid]);

  // Select chat
  const selectChat = useCallback(async (chat: Chat) => {
    setCurrentChat(chat);
    await loadMessages(chat.id);

    // Mark unread messages as read
    if (user?.uid) {
      const unreadMessageIds = messages
        .filter(msg => !msg.readBy.includes(user.uid))
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        await markAsRead(unreadMessageIds);
      }
    }
  }, [loadMessages, markAsRead, messages, user?.uid]);

  // Start typing
  const startTyping = useCallback(async () => {
    if (!user?.uid || !currentChat) return;

    try {
      await chatService.startTyping(currentChat.id, user.uid);
    } catch (error) {
      console.error('Error starting typing:', error);
    }
  }, [user?.uid, currentChat]);

  // Stop typing
  const stopTyping = useCallback(async () => {
    if (!user?.uid || !currentChat) return;

    try {
      await chatService.stopTyping(currentChat.id, user.uid);
    } catch (error) {
      console.error('Error stopping typing:', error);
    }
  }, [user?.uid, currentChat]);

  // Upload file
  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (!currentChat) throw new Error('No current chat selected');

    try {
      const fileUrl = await messageService.uploadFile(file, currentChat.id);
      return fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }, [currentChat]);

  return {
    chats,
    currentChat,
    messages,
    loading,
    loadChats,
    selectChat,
    sendMessage,
    createChat,
    markAsRead,
    startTyping,
    stopTyping,
    uploadFile,
  };
};