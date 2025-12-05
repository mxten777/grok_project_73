import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import type { Chat, Message } from '../types';

// Chat Services
export const chatService = {
  // Create new chat
  async createChat(chatData: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'chats'), {
      ...chatData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Get chat by ID
  async getChat(chatId: string): Promise<Chat | null> {
    const docRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt.toDate(),
      } as Chat;
    }
    return null;
  },

  // Get user's chats
  async getUserChats(userId: string): Promise<Chat[]> {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Chat[];
  },

  // Update chat
  async updateChat(chatId: string, updates: Partial<Chat>): Promise<void> {
    const docRef = doc(db, 'chats', chatId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete chat
  async deleteChat(chatId: string): Promise<void> {
    await deleteDoc(doc(db, 'chats', chatId));
  },

  // Subscribe to chat updates
  subscribeToChats(userId: string, callback: (chats: Chat[]) => void) {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const chats = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as Chat[];
      callback(chats);
    });
  },
};

// Message Services
export const messageService = {
  // Send message
  async sendMessage(messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...messageData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      readBy: [messageData.senderId], // Sender has read their own message
    });
    return docRef.id;
  },

  // Get messages for a chat
  async getMessages(chatId: string, limitCount: number = 50): Promise<Message[]> {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      }))
      .reverse() as Message[]; // Reverse to show oldest first
  },

  // Update message
  async updateMessage(messageId: string, updates: Partial<Message>): Promise<void> {
    const docRef = doc(db, 'messages', messageId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete message
  async deleteMessage(messageId: string): Promise<void> {
    await deleteDoc(doc(db, 'messages', messageId));
  },

  // Mark message as read
  async markAsRead(messageId: string, userId: string): Promise<void> {
    const docRef = doc(db, 'messages', messageId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const message = docSnap.data() as Message;
      if (!message.readBy.includes(userId)) {
        await updateDoc(docRef, {
          readBy: [...message.readBy, userId],
          updatedAt: Timestamp.now(),
        });
      }
    }
  },

  // Subscribe to new messages
  subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as Message[];
      callback(messages);
    });
  },
};