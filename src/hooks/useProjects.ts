import { useState, useEffect, useCallback } from 'react';
import type { Project } from '../firebase/projectServices';
import {
  createProject as apiCreateProject,
  getUserProjects,
  getProject,
  updateProject,
  deleteProject,
  subscribeToUserProjects,
} from '../firebase/projectServices';
import { useAuth } from './useAuth';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Load projects
  const loadProjects = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userProjects = await getUserProjects(user.uid);
      setProjects(userProjects);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('프로젝트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserProjects(user.uid, (updatedProjects) => {
      setProjects(updatedProjects);
    });

    return () => unsubscribe();
  }, [user]);

  // Load initial data
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Create a new project
  const createProject = async (projectData: {
    name: string;
    description?: string;
    members?: string[];
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const projectId = await apiCreateProject({
        ...projectData,
        ownerId: user.uid,
        ownerName: user.displayName || user.email || 'Unknown',
        members: [user.uid, ...(projectData.members || [])],
      });
      // Refresh projects
      await loadProjects();
      return projectId;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '프로젝트 생성에 실패했습니다.');
      throw err;
    }
  };

  // Update project
  const updateProjectInfo = async (projectId: string, updates: Partial<Pick<Project, 'name' | 'description' | 'members'>>) => {
    try {
      setError(null);
      await updateProject(projectId, { ...updates, updatedAt: new Date() });
      // Refresh projects
      await loadProjects();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '프로젝트 업데이트에 실패했습니다.');
      throw err;
    }
  };

  // Delete project
  const removeProject = async (projectId: string) => {
    if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까? 모든 태스크도 함께 삭제됩니다.')) return;

    try {
      setError(null);
      await deleteProject(projectId);
      // Refresh projects
      await loadProjects();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '프로젝트 삭제에 실패했습니다.');
      throw err;
    }
  };

  // Get project by ID
  const getProjectById = async (projectId: string): Promise<Project | null> => {
    try {
      return await getProject(projectId);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || '프로젝트를 불러오는데 실패했습니다.');
      return null;
    }
  };

  // Refresh data
  const refresh = () => {
    loadProjects();
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject: updateProjectInfo,
    removeProject,
    getProjectById,
    refresh,
    clearError: () => setError(null),
  };
};