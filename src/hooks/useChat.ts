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
    if (!user) return;

    setLoading(true);
    try {
      const userChats = await chatService.getUserChats(user.uid);
      setChats(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to chat updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = chatService.subscribeToChats(user.uid, (updatedChats) => {
      setChats(updatedChats);
    });

    return unsubscribe;
  }, [user]);

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
    if (!user || !currentChat) return;

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
  }, [user, currentChat]);

  // Create new chat
  const createChat = useCallback(async (participants: string[], name?: string, type: Chat['type'] = 'direct') => {
    if (!user) return;

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
  }, [user, loadChats]);

  // Select chat
  const selectChat = useCallback(async (chat: Chat) => {
    setCurrentChat(chat);
    await loadMessages(chat.id);
  }, [loadMessages]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!user) return;

    try {
      await Promise.all(
        messageIds.map(messageId => messageService.markAsRead(messageId, user.uid))
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

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
  };
};