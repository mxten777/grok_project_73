// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'employee';
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
}

// Team types
export interface Team {
  id: string;
  name: string;
  members: string[];
  managerId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  permissions: string[];
}

// Chat types
export interface Chat {
  id: string;
  type: 'direct' | 'group' | 'notice';
  participants: string[];
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  permissions: string[];
}

// Message types
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  reactions: { [emoji: string]: string[] };
  mentions: string[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  readBy: string[];
}

// Approval types
export interface Approval {
  id: string;
  type: 'vacation' | 'expense' | 'purchase' | 'quote' | 'contract';
  requesterId: string;
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
  approvers: string[];
  currentApprover?: string;
  data: Record<string, unknown>;
  pdfUrl?: string;
  history: ApprovalHistory[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  permissions: string[];
}

export interface ApprovalHistory {
  action: 'submitted' | 'approved' | 'rejected' | 'commented';
  userId: string;
  timestamp: Date;
  comment?: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  status: 'backlog' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  comments: Comment[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  permissions: string[];
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
}

// Schedule types
export interface Schedule {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  participants: string[];
  type: 'meeting' | 'event' | 'personal';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  permissions: string[];
}

// Notice types
export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  isPublished: boolean;
  publishAt?: Date;
  attachments: string[];
  versions: NoticeVersion[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  permissions: string[];
}

export interface NoticeVersion {
  version: number;
  content: string;
  updatedAt: Date;
  updatedBy: string;
}

// File types
export interface FileItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
}

// Log types
export interface Log {
  id: string;
  action: string;
  userId: string;
  details: Record<string, unknown>;
  timestamp: Date;
}