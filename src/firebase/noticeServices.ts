import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './config';

export interface Notice {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  isPublished: boolean;
  publishAt?: Date; // 예약 발행 시간
  publishedAt?: Date;
  isImportant: boolean; // 중요 공지
  category: 'general' | 'policy' | 'event' | 'hr' | 'it' | 'other';
  attachments?: string[]; // Firebase Storage 파일 URL들
  readBy: string[]; // 읽은 사용자 ID들
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NoticeDoc {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  isPublished: boolean;
  publishAt?: string; // ISO string
  publishedAt?: string; // ISO string
  isImportant: boolean;
  category: 'general' | 'policy' | 'event' | 'hr' | 'it' | 'other';
  attachments?: string[];
  readBy: string[];
  tags?: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Convert Firestore document to Notice
const docToNotice = (doc: QueryDocumentSnapshot): Notice => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    content: data.content,
    authorId: data.authorId,
    authorName: data.authorName,
    isPublished: data.isPublished,
    publishAt: data.publishAt ? new Date(data.publishAt) : undefined,
    publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
    isImportant: data.isImportant,
    category: data.category,
    attachments: data.attachments,
    readBy: data.readBy || [],
    tags: data.tags,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
};

// Convert Notice to Firestore document
const noticeToDoc = (notice: Omit<Notice, 'id'>): Omit<NoticeDoc, 'id'> => {
  return {
    title: notice.title,
    content: notice.content,
    authorId: notice.authorId,
    authorName: notice.authorName,
    isPublished: notice.isPublished,
    publishAt: notice.publishAt?.toISOString(),
    publishedAt: notice.publishedAt?.toISOString(),
    isImportant: notice.isImportant,
    category: notice.category,
    attachments: notice.attachments,
    readBy: notice.readBy,
    tags: notice.tags,
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString(),
  };
};

// Create a new notice
export const createNotice = async (notice: Omit<Notice, 'id'>): Promise<string> => {
  try {
    const docData = noticeToDoc(notice);
    const docRef = await addDoc(collection(db, 'notices'), docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notice:', error);
    throw error;
  }
};

// Get all published notices
export const getPublishedNotices = async (): Promise<Notice[]> => {
  try {
    const q = query(
      collection(db, 'notices'),
      where('isPublished', '==', true),
      orderBy('publishedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToNotice);
  } catch (error) {
    console.error('Error getting published notices:', error);
    throw error;
  }
};

// Get notices by category
export const getNoticesByCategory = async (category: string): Promise<Notice[]> => {
  try {
    const q = query(
      collection(db, 'notices'),
      where('isPublished', '==', true),
      where('category', '==', category),
      orderBy('publishedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToNotice);
  } catch (error) {
    console.error('Error getting notices by category:', error);
    throw error;
  }
};

// Get draft notices (for admin)
export const getDraftNotices = async (): Promise<Notice[]> => {
  try {
    const q = query(
      collection(db, 'notices'),
      where('isPublished', '==', false),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToNotice);
  } catch (error) {
    console.error('Error getting draft notices:', error);
    throw error;
  }
};

// Get a specific notice
export const getNotice = async (noticeId: string): Promise<Notice | null> => {
  try {
    const q = query(collection(db, 'notices'), where('__name__', '==', doc(db, 'notices', noticeId)));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return docToNotice(querySnapshot.docs[0]);
  } catch (error) {
    console.error('Error getting notice:', error);
    throw error;
  }
};

// Update a notice
export const updateNotice = async (noticeId: string, updates: Partial<Omit<Notice, 'id'>>): Promise<void> => {
  try {
    const docRef = doc(db, 'notices', noticeId);
    const updateData: Partial<Omit<NoticeDoc, 'id'>> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.isPublished !== undefined) {
      updateData.isPublished = updates.isPublished;
      if (updates.isPublished && !updates.publishedAt) {
        updateData.publishedAt = new Date().toISOString();
      }
    }
    if (updates.publishAt !== undefined) updateData.publishAt = updates.publishAt.toISOString();
    if (updates.publishedAt !== undefined) updateData.publishedAt = updates.publishedAt.toISOString();
    if (updates.isImportant !== undefined) updateData.isImportant = updates.isImportant;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.attachments !== undefined) updateData.attachments = updates.attachments;
    if (updates.readBy !== undefined) updateData.readBy = updates.readBy;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.updatedAt !== undefined) updateData.updatedAt = updates.updatedAt.toISOString();

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating notice:', error);
    throw error;
  }
};

// Delete a notice
export const deleteNotice = async (noticeId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'notices', noticeId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting notice:', error);
    throw error;
  }
};

// Mark notice as read by user
export const markNoticeAsRead = async (noticeId: string, userId: string): Promise<void> => {
  try {
    const notice = await getNotice(noticeId);
    if (!notice) throw new Error('Notice not found');

    const readBy = notice.readBy || [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
      await updateNotice(noticeId, { readBy, updatedAt: new Date() });
    }
  } catch (error) {
    console.error('Error marking notice as read:', error);
    throw error;
  }
};

// Subscribe to published notices for real-time updates
export const subscribeToPublishedNotices = (callback: (notices: Notice[]) => void) => {
  const q = query(
    collection(db, 'notices'),
    where('isPublished', '==', true),
    orderBy('publishedAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const notices = querySnapshot.docs.map(docToNotice);
    callback(notices);
  }, (error) => {
    console.error('Error subscribing to published notices:', error);
  });
};

// Get unread notices count for user
export const getUnreadNoticesCount = async (userId: string): Promise<number> => {
  try {
    const notices = await getPublishedNotices();
    return notices.filter(notice => !notice.readBy?.includes(userId)).length;
  } catch (error) {
    console.error('Error getting unread notices count:', error);
    return 0;
  }
};