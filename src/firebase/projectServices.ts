import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assigneeName?: string;
  reporterId: string;
  reporterName: string;
  projectId: string;
  tags?: string[];
  dueDate?: Date;
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Project {
  id?: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  members: string[]; // user IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDoc {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assigneeName?: string;
  reporterId: string;
  reporterName: string;
  projectId: string;
  tags?: string[];
  dueDate?: string; // ISO string
  attachments?: TaskAttachmentDoc[];
  comments?: TaskCommentDoc[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface TaskAttachmentDoc {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: string; // ISO string
}

export interface TaskCommentDoc {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface ProjectDoc {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  members: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Convert Firestore document to Task
const docToTask = (doc: QueryDocumentSnapshot): Task => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    assigneeId: data.assigneeId,
    assigneeName: data.assigneeName,
    reporterId: data.reporterId,
    reporterName: data.reporterName,
    projectId: data.projectId,
    tags: data.tags,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    attachments: data.attachments?.map((att: unknown) => ({
      ...(att as any),
      uploadedAt: new Date((att as any).uploadedAt),
    })),
    comments: data.comments?.map((comment: unknown) => ({
      ...(comment as any),
      createdAt: new Date((comment as any).createdAt),
      updatedAt: (comment as any).updatedAt ? new Date((comment as any).updatedAt) : undefined,
    })),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
};

// Convert Task to Firestore document
const taskToDoc = (task: Omit<Task, 'id'>): Omit<TaskDoc, 'id'> => {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId,
    assigneeName: task.assigneeName,
    reporterId: task.reporterId,
    reporterName: task.reporterName,
    projectId: task.projectId,
    tags: task.tags,
    dueDate: task.dueDate?.toISOString(),
    attachments: task.attachments?.map(att => ({
      ...att,
      uploadedAt: att.uploadedAt.toISOString(),
    })),
    comments: task.comments?.map(comment => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt?.toISOString(),
    })),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
};

// Convert Firestore document to Project
const docToProject = (doc: QueryDocumentSnapshot): Project => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
    ownerName: data.ownerName,
    members: data.members,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
};

// Convert Project to Firestore document
const projectToDoc = (project: Omit<Project, 'id'>): Omit<ProjectDoc, 'id'> => {
  return {
    name: project.name,
    description: project.description,
    ownerId: project.ownerId,
    ownerName: project.ownerName,
    members: project.members,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
};

// Upload file to Firebase Storage
export const uploadTaskAttachment = async (file: File, taskId: string, userId: string): Promise<TaskAttachment> => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storagePath = `tasks/${taskId}/attachments/${fileName}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      id: `${timestamp}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl: downloadURL,
      storagePath,
      uploadedBy: userId,
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error('Error uploading task attachment:', error);
    throw error;
  }
};

// Create a new project
export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const project: Omit<Project, 'id'> = {
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docData = projectToDoc(project);
    const docRef = await addDoc(collection(db, 'projects'), docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// Get all projects for a user
export const getUserProjects = async (userId: string): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToProject);
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
};

// Get a specific project
export const getProject = async (projectId: string): Promise<Project | null> => {
  try {
    const q = query(collection(db, 'projects'), where('__name__', '==', doc(db, 'projects', projectId)));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return docToProject(querySnapshot.docs[0]);
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
};

// Update project
export const updateProject = async (projectId: string, updates: Partial<Omit<Project, 'id'>>): Promise<void> => {
  try {
    const docRef = doc(db, 'projects', projectId);
    const updateData: Partial<Omit<ProjectDoc, 'id'>> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.members !== undefined) updateData.members = updates.members;
    if (updates.updatedAt !== undefined) updateData.updatedAt = updates.updatedAt.toISOString();

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Delete project
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    // Delete all tasks in the project first
    const tasks = await getProjectTasks(projectId);
    for (const task of tasks) {
      if (task.id) {
        await deleteTask(task.id);
      }
    }

    // Delete the project
    const docRef = doc(db, 'projects', projectId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Create a new task
export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const task: Omit<Task, 'id'> = {
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docData = taskToDoc(task);
    const docRef = await addDoc(collection(db, 'tasks'), docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Get all tasks for a project
export const getProjectTasks = async (projectId: string): Promise<Task[]> => {
  try {
    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToTask);
  } catch (error) {
    console.error('Error getting project tasks:', error);
    throw error;
  }
};

// Get a specific task
export const getTask = async (taskId: string): Promise<Task | null> => {
  try {
    const q = query(collection(db, 'tasks'), where('__name__', '==', doc(db, 'tasks', taskId)));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return docToTask(querySnapshot.docs[0]);
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
};

// Update task
export const updateTask = async (taskId: string, updates: Partial<Omit<Task, 'id'>>): Promise<void> => {
  try {
    const docRef = doc(db, 'tasks', taskId);
    const updateData: Partial<Omit<TaskDoc, 'id'>> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.assigneeId !== undefined) updateData.assigneeId = updates.assigneeId;
    if (updates.assigneeName !== undefined) updateData.assigneeName = updates.assigneeName;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate?.toISOString();
    if (updates.attachments !== undefined) updateData.attachments = updates.attachments?.map(att => ({
      ...att,
      uploadedAt: att.uploadedAt.toISOString(),
    }));
    if (updates.comments !== undefined) updateData.comments = updates.comments?.map(comment => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt?.toISOString(),
    }));
    if (updates.updatedAt !== undefined) updateData.updatedAt = updates.updatedAt.toISOString();

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Delete task
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    // Get task to delete attachments
    const task = await getTask(taskId);
    if (task?.attachments) {
      for (const attachment of task.attachments) {
        const storageRef = ref(storage, attachment.storagePath);
        await deleteObject(storageRef);
      }
    }

    // Delete the task
    const docRef = doc(db, 'tasks', taskId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Add comment to task
export const addTaskComment = async (taskId: string, comment: Omit<TaskComment, 'id'>): Promise<void> => {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');

    const newComment: TaskComment = {
      ...comment,
      id: `${Date.now()}`,
    };

    const updatedComments = [...(task.comments || []), newComment];
    await updateTask(taskId, { comments: updatedComments, updatedAt: new Date() });
  } catch (error) {
    console.error('Error adding task comment:', error);
    throw error;
  }
};

// Update task comment
export const updateTaskComment = async (taskId: string, commentId: string, content: string): Promise<void> => {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');

    const updatedComments = task.comments?.map(comment =>
      comment.id === commentId
        ? { ...comment, content, updatedAt: new Date() }
        : comment
    ) || [];

    await updateTask(taskId, { comments: updatedComments, updatedAt: new Date() });
  } catch (error) {
    console.error('Error updating task comment:', error);
    throw error;
  }
};

// Delete task comment
export const deleteTaskComment = async (taskId: string, commentId: string): Promise<void> => {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');

    const updatedComments = task.comments?.filter(comment => comment.id !== commentId) || [];
    await updateTask(taskId, { comments: updatedComments, updatedAt: new Date() });
  } catch (error) {
    console.error('Error deleting task comment:', error);
    throw error;
  }
};

// Subscribe to project tasks (real-time updates)
export const subscribeToProjectTasks = (projectId: string, callback: (tasks: Task[]) => void) => {
  const q = query(
    collection(db, 'tasks'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const tasks = querySnapshot.docs.map(docToTask);
    callback(tasks);
  });
};

// Subscribe to projects (real-time updates)
export const subscribeToUserProjects = (userId: string, callback: (projects: Project[]) => void) => {
  const q = query(
    collection(db, 'projects'),
    where('members', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const projects = querySnapshot.docs.map(docToProject);
    callback(projects);
  });
};