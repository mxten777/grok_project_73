import React, { useState, useRef } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { Dialog } from '@headlessui/react';
import {
  PlusIcon,
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { Task } from '../firebase/projectServices';

interface KanbanBoardProps {
  projectId: string;
  onBack: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, onBack }) => {
  const { loading, error, createTask, updateTask, moveTask, removeTask, addComment, uploadAttachment, getTasksByStatus } = useTasks(projectId);
  const { projects } = useProjects();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    assigneeId: '',
    assigneeName: '',
    tags: '',
    dueDate: '',
  });
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    assigneeId: '',
    assigneeName: '',
    tags: '',
    dueDate: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const project = projects.find(p => p.id === projectId);

  const columns = [
    { id: 'backlog', title: '백로그', color: 'bg-gray-100' },
    { id: 'todo', title: '할 일', color: 'bg-blue-100' },
    { id: 'in-progress', title: '진행중', color: 'bg-yellow-100' },
    { id: 'review', title: '검토', color: 'bg-purple-100' },
    { id: 'done', title: '완료', color: 'bg-green-100' },
  ];

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();

    const tags = createForm.tags ? createForm.tags.split(',').map(tag => tag.trim()) : [];
    const dueDate = createForm.dueDate ? new Date(createForm.dueDate) : undefined;

    try {
      await createTask({
        title: createForm.title,
        description: createForm.description,
        priority: createForm.priority,
        assigneeId: createForm.assigneeId || undefined,
        assigneeName: createForm.assigneeName || undefined,
        tags,
        dueDate,
      });

      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        priority: 'medium',
        assigneeId: '',
        assigneeName: '',
        tags: '',
        dueDate: '',
      });
    } catch {
      // Error is handled in the hook
    }
  };

  const handleEditTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTask?.id) return;

    const tags = editForm.tags ? editForm.tags.split(',').map(tag => tag.trim()) : [];
    const dueDate = editForm.dueDate ? new Date(editForm.dueDate) : undefined;

    try {
      await updateTask(selectedTask.id, {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        assigneeId: editForm.assigneeId || undefined,
        assigneeName: editForm.assigneeName || undefined,
        tags,
        dueDate,
      });

      setShowTaskModal(false);
      setSelectedTask(null);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      assigneeName: task.assigneeName || '',
      tags: task.tags?.join(', ') || '',
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
    });
    setShowTaskModal(true);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent, newStatus: Task['status']) => {
    event.preventDefault();
    if (!draggedTask?.id) return;

    try {
      await moveTask(draggedTask.id, newStatus);
      setDraggedTask(null);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask?.id || !newComment.trim()) return;

    try {
      await addComment(selectedTask.id, newComment);
      setNewComment('');
    } catch {
      // Error is handled in the hook
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTask?.id) return;

    try {
      await uploadAttachment(selectedTask.id, file);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask?.id) return;

    try {
      await removeTask(selectedTask.id);
      setShowTaskModal(false);
      setSelectedTask(null);
    } catch {
      // Error is handled in the hook
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project?.name || '프로젝트'}</h1>
              <p className="text-sm text-gray-500">Kanban 보드</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            태스크 추가
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 min-w-max">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id as Task['status']);

            return (
              <div
                key={column.id}
                className="w-80 flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id as Task['status'])}
              >
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        onClick={() => handleTaskClick(task)}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                            {task.title}
                          </h4>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'urgent' ? '긴급' :
                             task.priority === 'high' ? '높음' :
                             task.priority === 'medium' ? '중간' : '낮음'}
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-3">
                            {task.assigneeName && (
                              <div className="flex items-center gap-1">
                                <UserIcon className="h-3 w-3" />
                                <span>{task.assigneeName}</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{formatDate(task.dueDate)}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {task.comments && task.comments.length > 0 && (
                              <div className="flex items-center gap-1">
                                <ChatBubbleLeftIcon className="h-3 w-3" />
                                <span>{task.comments.length}</span>
                              </div>
                            )}
                            {task.attachments && task.attachments.length > 0 && (
                              <div className="flex items-center gap-1">
                                <PaperClipIcon className="h-3 w-3" />
                                <span>{task.attachments.length}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{task.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Task Modal */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">새 태스크 생성</Dialog.Title>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">낮음</option>
                  <option value="medium">중간</option>
                  <option value="high">높음</option>
                  <option value="urgent">긴급</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                <input
                  type="text"
                  value={createForm.assigneeName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, assigneeName: e.target.value }))}
                  placeholder="담당자 이름"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                <input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">태그 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="예: 디자인, 개발, 테스트"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  생성
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Task Detail Modal */}
      <Dialog open={showTaskModal} onClose={() => setShowTaskModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {selectedTask && (
              <>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="text-xl font-semibold text-gray-900 border-none p-0 focus:ring-0 w-full"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getPriorityColor(editForm.priority)}`}>
                          {editForm.priority === 'urgent' ? '긴급' :
                           editForm.priority === 'high' ? '높음' :
                           editForm.priority === 'medium' ? '중간' : '낮음'}
                        </span>
                        {editForm.assigneeName && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <UserIcon className="h-4 w-4" />
                            {editForm.assigneeName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteTask}
                        className="p-2 text-red-400 hover:text-red-600"
                        title="삭제"
                      >
                        <ExclamationTriangleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
                        <select
                          value={editForm.priority}
                          onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="low">낮음</option>
                          <option value="medium">중간</option>
                          <option value="high">높음</option>
                          <option value="urgent">긴급</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                        <input
                          type="date"
                          value={editForm.dueDate}
                          onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                      <input
                        type="text"
                        value={editForm.assigneeName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, assigneeName: e.target.value }))}
                        placeholder="담당자 이름"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="태그를 쉼표로 구분"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">첨부 파일</h3>
                    <div className="space-y-2">
                      {selectedTask.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <PaperClipIcon className="h-5 w-5 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {(attachment.fileSize / 1024).toFixed(1)} KB • {attachment.uploadedBy}
                            </p>
                          </div>
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            다운로드
                          </a>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <PlusIcon className="h-4 w-4" />
                      파일 첨부
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Comments */}
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">댓글</h3>

                  <div className="space-y-4 mb-4">
                    {selectedTask.comments?.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{comment.authorName}</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder="댓글을 입력하세요..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      추가
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleEditTask}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    저장
                  </button>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default KanbanBoard;