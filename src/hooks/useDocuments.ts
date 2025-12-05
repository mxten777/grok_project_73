import { useState, useEffect, useCallback } from 'react';
import type { Document, DocumentVersion } from '../firebase/documentServices';
import {
  uploadDocument as apiUploadDocument,
  getDocuments,
  getDocumentVersions,
  downloadDocument,
  deleteDocument,
  updateDocumentPermissions,
  subscribeToDocuments,
} from '../firebase/documentServices';
import { useAuth } from './useAuth';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { user } = useAuth();

  // Load documents
  const loadDocuments = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const docs = await getDocuments(user.uid);
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('문서를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToDocuments((updatedDocuments) => {
      setDocuments(updatedDocuments);
    }, user.uid);

    return () => unsubscribe();
  }, [user]);

  // Load initial data
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Upload a new document
  const uploadDocument = async (
    file: File,
    metadata: {
      title: string;
      description?: string;
      category: string;
      tags?: string[];
      permissions: {
        read: string[];
        write: string[];
        delete: string[];
      };
    }
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setUploading(true);
      setError(null);
      const document = await apiUploadDocument(file, {
        ...metadata,
        category: metadata.category as Document['category']
      }, user.uid, user.displayName || user.email || 'Unknown');
      // Refresh documents
      await loadDocuments();
      return document;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '문서 업로드에 실패했습니다.');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Get document versions
  const getVersions = async (documentId: string): Promise<DocumentVersion[]> => {
    try {
      return await getDocumentVersions(documentId);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '버전 정보를 불러오는데 실패했습니다.');
      throw err;
    }
  };

  // Download document
  const download = async (documentId: string, versionId?: string) => {
    try {
      setError(null);
      const url = await downloadDocument(documentId, versionId);
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '다운로드에 실패했습니다.');
      throw err;
    }
  };

  // Delete document
  const removeDocument = async (documentId: string) => {
    try {
      setError(null);
      await deleteDocument(documentId);
      // Update local state
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '문서 삭제에 실패했습니다.');
      throw err;
    }
  };

  // Update permissions
  const updatePermissions = async (
    documentId: string,
    permissions: {
      read: string[];
      write: string[];
      delete: string[];
    }
  ) => {
    try {
      setError(null);
      await updateDocumentPermissions(documentId, permissions);
      // Update local state
      setDocuments(prevDocs =>
        prevDocs.map(doc =>
          doc.id === documentId
            ? { ...doc, permissions }
            : doc
        )
      );
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '권한 업데이트에 실패했습니다.');
      throw err;
    }
  };

  // Check if user has permission
  const hasPermission = (document: Document, permission: 'read' | 'write' | 'delete'): boolean => {
    if (!user) return false;

    // Check specific permissions
    return document.permissions[permission].includes(user.uid) ||
           document.permissions[permission].includes('*') ||
           document.permissions[permission].includes('all');
  };

  // Refresh data
  const refresh = () => {
    loadDocuments();
  };

  return {
    documents,
    loading,
    error,
    uploading,
    uploadDocument,
    getVersions,
    download,
    removeDocument,
    updatePermissions,
    hasPermission,
    refresh,
    clearError: () => setError(null),
  };
};