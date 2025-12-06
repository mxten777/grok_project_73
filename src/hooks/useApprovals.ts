import { useState, useEffect, useCallback } from 'react';
import { approvalService } from '../firebase/approvalServices';
import type { Approval } from '../types';
import { useAuth } from './useAuth';

export const useApprovals = () => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [myRequests, setMyRequests] = useState<Approval[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);

  // Load pending approvals (approvals I need to review)
  const loadPendingApprovals = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const approvals = await approvalService.getPendingApprovals(user.uid);
      setPendingApprovals(approvals);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Load my approval requests
  const loadMyRequests = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const requests = await approvalService.getUserApprovals(user.uid);
      setMyRequests(requests);
    } catch (error) {
      console.error('Error loading my requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Load approval history
  const loadApprovalHistory = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Get all approvals where user is involved (as requester or approver)
      const [myRequests, pendingApprovals] = await Promise.all([
        approvalService.getUserApprovals(user.uid),
        approvalService.getPendingApprovals(user.uid),
      ]);

      const allApprovals = [...myRequests, ...pendingApprovals];
      const completedApprovals = allApprovals.filter(
        approval => approval.status === 'approved' || approval.status === 'rejected'
      );

      setApprovalHistory(completedApprovals);
    } catch (error) {
      console.error('Error loading approval history:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Process approval (approve or reject)
  const processApproval = useCallback(async (
    approvalId: string,
    action: 'approved' | 'rejected',
    comment?: string
  ) => {
    if (!user?.uid) return;

    try {
      await approvalService.processApproval(approvalId, user.uid, action, comment);
      // Reload data after processing
      await Promise.all([
        loadPendingApprovals(),
        loadApprovalHistory(),
      ]);
    } catch (error) {
      console.error('Error processing approval:', error);
      throw error;
    }
  }, [user?.uid, loadPendingApprovals, loadApprovalHistory]);

  // Create new approval
  const createApproval = useCallback(async (approvalData: Omit<Approval, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const approvalId = await approvalService.createApproval(approvalData);
      await loadMyRequests(); // Reload my requests
      return approvalId;
    } catch (error) {
      console.error('Error creating approval:', error);
      throw error;
    }
  }, [loadMyRequests]);

  // Submit approval for review
  const submitApproval = useCallback(async (approvalId: string) => {
    try {
      await approvalService.submitApproval(approvalId);
      await loadMyRequests(); // Reload my requests
    } catch (error) {
      console.error('Error submitting approval:', error);
      throw error;
    }
  }, [loadMyRequests]);

  // Load all data on mount
  useEffect(() => {
    if (user?.uid) {
      loadPendingApprovals();
      loadMyRequests();
      loadApprovalHistory();
    }
  }, [user?.uid, loadPendingApprovals, loadMyRequests, loadApprovalHistory]);

  return {
    pendingApprovals,
    myRequests,
    approvalHistory,
    loading,
    loadPendingApprovals,
    loadMyRequests,
    loadApprovalHistory,
    processApproval,
    createApproval,
    submitApproval,
  };
};