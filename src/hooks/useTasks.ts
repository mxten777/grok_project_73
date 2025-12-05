import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../firebase/projectServices';
import {
  createTask as apiCreateTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  addTaskComment,
  updateTaskComment,
  deleteTaskComment,
  subscribeToProjectTasks,
  uploadTaskAttachment,
} from '../firebase/projectServices';
import { useAuth } from './useAuth';

export const useTasks = (projectId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { user } = useAuth();

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const projectTasks = await getProjectTasks(projectId);
      setTasks(projectTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('태스크를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeToProjectTasks(projectId, (updatedTasks) => {
      setTasks(updatedTasks);
    });

    return () => unsubscribe();
  }, [projectId]);

  // Load initial data
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Create a new task
  const createTask = async (taskData: {
    title: string;
    description?: string;
    priority: Task['priority'];
    assigneeId?: string;
    assigneeName?: string;
    tags?: string[];
    dueDate?: Date;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const taskId = await apiCreateTask({
        ...taskData,
        status: 'backlog',
        reporterId: user.uid,
        reporterName: user.displayName || user.email || 'Unknown',
        projectId,
      });
      // Tasks will be updated via subscription
      return taskId;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '태스크 생성에 실패했습니다.');
      throw err;
    }
  };

  // Update task
  const updateTaskInfo = async (taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assigneeId' | 'assigneeName' | 'tags' | 'dueDate'>>) => {
    try {
      setError(null);
      await updateTask(taskId, { ...updates, updatedAt: new Date() });
      // Tasks will be updated via subscription
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '태스크 업데이트에 실패했습니다.');
      throw err;
    }
  };

  // Delete task
  const removeTask = async (taskId: string) => {
    if (!confirm('정말로 이 태스크를 삭제하시겠습니까?')) return;

    try {
      setError(null);
      await deleteTask(taskId);
      // Tasks will be updated via subscription
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '태스크 삭제에 실패했습니다.');
      throw err;
    }
  };

  // Move task to different status
  const moveTask = async (taskId: string, newStatus: Task['status']) => {
    try {
      setError(null);
      await updateTask(taskId, { status: newStatus, updatedAt: new Date() });
      // Tasks will be updated via subscription
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '태스크 이동에 실패했습니다.');
      throw err;
    }
  };

  // Add comment to task
  const addComment = async (taskId: string, content: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      await addTaskComment(taskId, {
        content,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Unknown',
        createdAt: new Date(),
      });
      // Tasks will be updated via subscription
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '댓글 추가에 실패했습니다.');
      throw err;
    }
  };

  // Update comment
  const updateComment = async (taskId: string, commentId: string, content: string) => {
    try {
      setError(null);
      await updateTaskComment(taskId, commentId, content);
      // Tasks will be updated via subscription
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '댓글 수정에 실패했습니다.');
      throw err;
    }
  };

  // Delete comment
  const removeComment = async (taskId: string, commentId: string) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      setError(null);
      await deleteTaskComment(taskId, commentId);
      // Tasks will be updated via subscription
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '댓글 삭제에 실패했습니다.');
      throw err;
    }
  };

  // Upload attachment
  const uploadAttachment = async (taskId: string, file: File) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setUploading(true);
      setError(null);
      const attachment = await uploadTaskAttachment(
        file,
        taskId,
        user.uid
      );

      // Get current task and add attachment
      const task = await getTask(taskId);
      if (!task) throw new Error('Task not found');

      const updatedAttachments = [...(task.attachments || []), attachment];
      await updateTask(taskId, { attachments: updatedAttachments, updatedAt: new Date() });
      // Tasks will be updated via subscription
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '파일 업로드에 실패했습니다.');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Get tasks by status
  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  // Get task by ID
  const getTaskById = (taskId: string) => {
    return tasks.find(task => task.id === taskId) || null;
  };

  // Refresh data
  const refresh = () => {
    loadTasks();
  };

  return {
    tasks,
    loading,
    error,
    uploading,
    createTask,
    updateTask: updateTaskInfo,
    removeTask,
    moveTask,
    addComment,
    updateComment,
    removeComment,
    uploadAttachment,
    getTasksByStatus,
    getTaskById,
    refresh,
    clearError: () => setError(null),
  };
};