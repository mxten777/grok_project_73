import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';

export interface Document {
  id?: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  storagePath: string;
  category: 'policy' | 'guide' | 'manual' | 'template' | 'other';
  tags?: string[];
  uploadedBy: string;
  uploaderName: string;
  version: number;
  isLatest: boolean;
  parentDocumentId?: string; // 버전 관리를 위한 부모 문서 ID
  permissions: {
    read: string[]; // 읽기 권한이 있는 사용자/그룹 ID들
    write: string[]; // 쓰기 권한이 있는 사용자/그룹 ID들
    delete: string[]; // 삭제 권한이 있는 사용자/그룹 ID들
  };
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  uploadedAt: Date;
  uploadedBy: string;
  uploaderName: string;
  changelog?: string;
  fileSize: number;
  fileUrl: string;
}

export interface DocumentDoc {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  storagePath: string;
  category: 'policy' | 'guide' | 'manual' | 'template' | 'other';
  tags?: string[];
  uploadedBy: string;
  uploaderName: string;
  version: number;
  isLatest: boolean;
  parentDocumentId?: string;
  permissions: {
    read: string[];
    write: string[];
    delete: string[];
  };
  downloadCount: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Convert Firestore document to Document
const docToDocument = (doc: QueryDocumentSnapshot): Document => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    fileName: data.fileName,
    fileSize: data.fileSize,
    fileType: data.fileType,
    fileUrl: data.fileUrl,
    storagePath: data.storagePath,
    category: data.category,
    tags: data.tags,
    uploadedBy: data.uploadedBy,
    uploaderName: data.uploaderName,
    version: data.version,
    isLatest: data.isLatest,
    parentDocumentId: data.parentDocumentId,
    permissions: data.permissions,
    downloadCount: data.downloadCount,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
};

// Convert Document to Firestore document
const documentToDoc = (document: Omit<Document, 'id'>): Omit<DocumentDoc, 'id'> => {
  return {
    title: document.title,
    description: document.description,
    fileName: document.fileName,
    fileSize: document.fileSize,
    fileType: document.fileType,
    fileUrl: document.fileUrl,
    storagePath: document.storagePath,
    category: document.category,
    tags: document.tags,
    uploadedBy: document.uploadedBy,
    uploaderName: document.uploaderName,
    version: document.version,
    isLatest: document.isLatest,
    parentDocumentId: document.parentDocumentId,
    permissions: document.permissions,
    downloadCount: document.downloadCount,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
};

// Upload file to Firebase Storage
export const uploadFile = async (file: File, userId: string): Promise<{ url: string; path: string }> => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storagePath = `documents/${userId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { url: downloadURL, path: storagePath };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Create a new document
export const createDocument = async (
  file: File,
  metadata: {
    title: string;
    description?: string;
    category: Document['category'];
    tags?: string[];
    uploadedBy: string;
    uploaderName: string;
    permissions?: Partial<Document['permissions']>;
  }
): Promise<string> => {
  try {
    // Upload file first
    const { url, path } = await uploadFile(file, metadata.uploadedBy);

    // Check if this is a new version of existing document
    let version = 1;
    let parentDocumentId: string | undefined;

    if (metadata.title) {
      const existingDocs = await getDocumentsByTitle(metadata.title);
      if (existingDocs.length > 0) {
        // Mark previous version as not latest
        const latestDoc = existingDocs[0];
        await updateDocument(latestDoc.id!, { isLatest: false });

        version = latestDoc.version + 1;
        parentDocumentId = latestDoc.parentDocumentId || latestDoc.id;
      }
    }

    const document: Omit<Document, 'id'> = {
      title: metadata.title,
      description: metadata.description,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl: url,
      storagePath: path,
      category: metadata.category,
      tags: metadata.tags,
      uploadedBy: metadata.uploadedBy,
      uploaderName: metadata.uploaderName,
      version,
      isLatest: true,
      parentDocumentId,
      permissions: {
        read: metadata.permissions?.read || ['*'], // '*' means all users
        write: metadata.permissions?.write || [metadata.uploadedBy],
        delete: metadata.permissions?.delete || [metadata.uploadedBy],
      },
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docData = documentToDoc(document);
    const docRef = await addDoc(collection(db, 'documents'), docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Get all documents (with permission check)
export const getDocuments = async (userId: string): Promise<Document[]> => {
  try {
    const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    // Filter by read permissions
    const documents = querySnapshot.docs
      .map(docToDocument)
      .filter(doc => doc.permissions.read.includes('*') || doc.permissions.read.includes(userId));

    return documents;
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
};

// Get documents by category
export const getDocumentsByCategory = async (category: string, userId: string): Promise<Document[]> => {
  try {
    const q = query(
      collection(db, 'documents'),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs
      .map(docToDocument)
      .filter(doc => doc.permissions.read.includes('*') || doc.permissions.read.includes(userId));

    return documents;
  } catch (error) {
    console.error('Error getting documents by category:', error);
    throw error;
  }
};

// Get documents by title (for version management)
export const getDocumentsByTitle = async (title: string): Promise<Document[]> => {
  try {
    const q = query(
      collection(db, 'documents'),
      where('title', '==', title),
      orderBy('version', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToDocument);
  } catch (error) {
    console.error('Error getting documents by title:', error);
    throw error;
  }
};

// Get document versions
export const getDocumentVersions = async (parentDocumentId: string): Promise<DocumentVersion[]> => {
  try {
    const q = query(
      collection(db, 'documents'),
      where('parentDocumentId', '==', parentDocumentId),
      orderBy('version', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        versionNumber: data.version,
        uploadedAt: new Date(data.createdAt),
        uploadedBy: data.uploadedBy,
        uploaderName: data.uploaderName,
        fileSize: data.fileSize,
        fileUrl: data.fileUrl,
      };
    });
  } catch (error) {
    console.error('Error getting document versions:', error);
    throw error;
  }
};

// Update document metadata
export const updateDocument = async (documentId: string, updates: Partial<Omit<Document, 'id'>>): Promise<void> => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const updateData: Partial<Omit<DocumentDoc, 'id'>> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.isLatest !== undefined) updateData.isLatest = updates.isLatest;
    if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
    if (updates.downloadCount !== undefined) updateData.downloadCount = updates.downloadCount;
    if (updates.updatedAt !== undefined) updateData.updatedAt = updates.updatedAt.toISOString();

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// Delete document (and file from storage)
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    const document = await getDocument(documentId);
    if (!document) throw new Error('Document not found');

    // Delete from Storage
    const storageRef = ref(storage, document.storagePath);
    await deleteObject(storageRef);

    // Delete from Firestore
    const docRef = doc(db, 'documents', documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Get a specific document
export const getDocument = async (documentId: string): Promise<Document | null> => {
  try {
    const q = query(collection(db, 'documents'), where('__name__', '==', doc(db, 'documents', documentId)));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return docToDocument(querySnapshot.docs[0]);
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

// Increment download count
export const incrementDownloadCount = async (documentId: string): Promise<void> => {
  try {
    const document = await getDocument(documentId);
    if (!document) throw new Error('Document not found');

    await updateDocument(documentId, {
      downloadCount: document.downloadCount + 1,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error incrementing download count:', error);
    throw error;
  }
};

// Search documents
export const searchDocuments = async (query: string, userId: string): Promise<Document[]> => {
  try {
    const allDocs = await getDocuments(userId);
    const lowerQuery = query.toLowerCase();

    return allDocs.filter(doc =>
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.description?.toLowerCase().includes(lowerQuery) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

// Upload document (wrapper for createDocument)
export const uploadDocument = async (
  file: File,
  metadata: {
    title: string;
    description?: string;
    category: Document['category'];
    tags?: string[];
    permissions: {
      read: string[];
      write: string[];
      delete: string[];
    };
  },
  userId: string,
  userName: string
): Promise<Document> => {
  try {
    const documentId = await createDocument(file, {
      title: metadata.title,
      description: metadata.description,
      category: metadata.category,
      tags: metadata.tags,
      uploadedBy: userId,
      uploaderName: userName,
      permissions: metadata.permissions,
    });

    const document = await getDocument(documentId);
    if (!document) throw new Error('Failed to retrieve uploaded document');
    return document;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

// Download document (increment download count)
export const downloadDocument = async (documentId: string, versionId?: string): Promise<string> => {
  try {
    let document: Document | null = null;

    if (versionId) {
      // Download specific version
      document = await getDocument(versionId);
    } else {
      // Download latest version
      document = await getDocument(documentId);
    }

    if (!document) throw new Error('Document not found');

    // Increment download count
    await incrementDownloadCount(document.id!);

    return document.fileUrl;
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
};

// Update document permissions
export const updateDocumentPermissions = async (
  documentId: string,
  permissions: {
    read: string[];
    write: string[];
    delete: string[];
  }
): Promise<void> => {
  try {
    await updateDocument(documentId, {
      permissions,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating document permissions:', error);
    throw error;
  }
};

// Subscribe to documents (real-time updates)
export const subscribeToDocuments = (callback: (documents: Document[]) => void, userId: string) => {
  const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs
      .map(docToDocument)
      .filter(doc => doc.permissions.read.includes('*') || doc.permissions.read.includes(userId));

    callback(documents);
  });
};