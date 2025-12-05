import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Approval, ApprovalHistory } from '../types';

// Approval Services
export const approvalService = {
  // Create new approval
  async createApproval(approvalData: Omit<Approval, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'approvals'), {
      ...approvalData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Get approval by ID
  async getApproval(approvalId: string): Promise<Approval | null> {
    const docRef = doc(db, 'approvals', approvalId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt.toDate(),
      } as Approval;
    }
    return null;
  },

  // Get user's approvals
  async getUserApprovals(userId: string): Promise<Approval[]> {
    const q = query(
      collection(db, 'approvals'),
      where('requesterId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Approval[];
  },

  // Get pending approvals for user (as approver)
  async getPendingApprovals(userId: string): Promise<Approval[]> {
    const q = query(
      collection(db, 'approvals'),
      where('approvers', 'array-contains', userId),
      where('status', 'in', ['submitted', 'reviewing']),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Approval[];
  },

  // Update approval
  async updateApproval(approvalId: string, updates: Partial<Approval>): Promise<void> {
    const docRef = doc(db, 'approvals', approvalId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Approve or reject approval
  async processApproval(
    approvalId: string,
    userId: string,
    action: 'approved' | 'rejected',
    comment?: string
  ): Promise<void> {
    const approval = await this.getApproval(approvalId);
    if (!approval) throw new Error('Approval not found');

    const historyEntry: ApprovalHistory = {
      action,
      userId,
      timestamp: new Date(),
      comment,
    };

    const updates: Partial<Approval> = {
      status: action,
      currentApprover: undefined,
      history: [...(approval.history || []), historyEntry],
    };

    await this.updateApproval(approvalId, updates);
  },

  // Submit approval for review
  async submitApproval(approvalId: string): Promise<void> {
    const approval = await this.getApproval(approvalId);
    if (!approval) throw new Error('Approval not found');

    await this.updateApproval(approvalId, {
      status: 'submitted',
      currentApprover: approval.approvers[0], // First approver
    });
  },
};