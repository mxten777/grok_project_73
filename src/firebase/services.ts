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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from './config';
import { storage } from './config';
import type { Chat, Message } from '../types';

// Chat Services
export const chatService = {
  // Create new chat
  async createChat(chatData: Omit<Chat, 'id' | 'createdAt' | 'updatedAt' | 'typingUsers'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'chats'), {
      ...chatData,
      typingUsers: [],
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
    console.log('chatService: Getting chats for user:', userId);
    try {
      // First try without orderBy to test basic functionality
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId)
      );

      console.log('chatService: Executing query...');
      const querySnapshot = await getDocs(q);
      console.log('chatService: Query completed, docs:', querySnapshot.docs.length);

      const chats = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('chatService: Processing doc:', doc.id, data);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Chat;
      });

      // Sort by updatedAt in memory
      chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      console.log('chatService: Processed and sorted chats:', chats);
      return chats;
    } catch (error) {
      console.error('chatService: Error in getUserChats:', error);
      throw error;
    }
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

  // Start typing
  async startTyping(chatId: string, userId: string): Promise<void> {
    const docRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const chat = docSnap.data() as Chat;
      if (!chat.typingUsers.includes(userId)) {
        await updateDoc(docRef, {
          typingUsers: [...chat.typingUsers, userId],
          updatedAt: Timestamp.now(),
        });
      }
    }
  },

  // Stop typing
  async stopTyping(chatId: string, userId: string): Promise<void> {
    const docRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const chat = docSnap.data() as Chat;
      const updatedTypingUsers = chat.typingUsers.filter(id => id !== userId);
      await updateDoc(docRef, {
        typingUsers: updatedTypingUsers,
        updatedAt: Timestamp.now(),
      });
    }
  },

  // Subscribe to chat updates
  subscribeToChats(userId: string, callback: (chats: Chat[]) => void) {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const chats = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as Chat[];

      // Sort by updatedAt in memory
      chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

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

  // Upload file to Firebase Storage
  async uploadFile(file: File, chatId: string): Promise<string> {
    const fileRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
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