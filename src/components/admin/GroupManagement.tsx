import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, UserMinusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useGroups, useUsers } from '../../hooks/useAdmin';
import { AdminGroup, AdminUser } from '../../firebase/adminServices';

const GroupManagement: React.FC = () => {
  const { groups, loading: groupsLoading, error: groupsError, createGroup, updateGroup, deleteGroup, addMemberToGroup, removeMemberFromGroup } = useGroups();
  const { users, loading: usersLoading } = useUsers();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminGroup | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<AdminGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  const handleCreateGroup = async () => {
    try {
      await createGroup({ ...formData, members: [] });
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('그룹 생성 실패:', error);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    try {
      await updateGroup(editingGroup.id, formData);
      setEditingGroup(null);
      resetForm();
    } catch (error) {
      console.error('그룹 업데이트 실패:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('정말로 이 그룹을 삭제하시겠습니까?')) return;
    try {
      await deleteGroup(groupId);
    } catch (error) {
      console.error('그룹 삭제 실패:', error);
    }
  };

  const handleAddMember = async (groupId: string, userId: string) => {
    try {
      await addMemberToGroup(groupId, userId);
    } catch (error) {
      console.error('멤버 추가 실패:', error);
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    try {
      await removeMemberFromGroup(groupId, userId);
    } catch (error) {
      console.error('멤버 제거 실패:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
    });
  };

  const openEditModal = (group: AdminGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      permissions: group.permissions,
    });
  };

  const getUserById = (userId: string): AdminUser | undefined => {
    return users.find(user => user.id === userId);
  };

  const getAvailableUsers = (group: AdminGroup): AdminUser[] => {
    return users.filter(user => !group.members.includes(user.id));
  };

  if (groupsLoading || usersLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (groupsError) {
    return (
      <div className="p-6">
        <div className="text-red-600">{groupsError}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">그룹 관리</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          그룹 추가
        </button>
      </div>

      {/* 그룹 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-500">{group.members.length}명</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedGroup(group)}
                  className="text-blue-600 hover:text-blue-900"
                  title="멤버 관리"
                >
                  <UserPlusIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal(group)}
                  className="text-gray-600 hover:text-gray-900"
                  title="편집"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="text-red-600 hover:text-red-900"
                  title="삭제"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{group.description}</p>
            <div className="flex flex-wrap gap-1">
              {group.permissions.map((permission, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {permission}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 그룹 생성 모달 */}
      <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md bg-white rounded-lg p-6">
              <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                그룹 추가
              </Dialog.Title>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">그룹명</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">권한</label>
                  <div className="mt-2 space-y-2">
                    {['read', 'write', 'admin', 'approve'].map((permission) => (
                      <label key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                permissions: [...formData.permissions, permission]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                permissions: formData.permissions.filter(p => p !== permission)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  추가
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>

      {/* 그룹 편집 모달 */}
      <Dialog open={!!editingGroup} onClose={() => setEditingGroup(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md bg-white rounded-lg p-6">
              <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                그룹 편집
              </Dialog.Title>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">그룹명</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">권한</label>
                  <div className="mt-2 space-y-2">
                    {['read', 'write', 'admin', 'approve'].map((permission) => (
                      <label key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                permissions: [...formData.permissions, permission]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                permissions: formData.permissions.filter(p => p !== permission)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingGroup(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateGroup}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>

      {/* 멤버 관리 모달 */}
      <Dialog open={!!selectedGroup} onClose={() => setSelectedGroup(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg p-6">
              <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                {selectedGroup?.name} - 멤버 관리
              </Dialog.Title>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 현재 멤버 */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">현재 멤버 ({selectedGroup?.members.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedGroup?.members.map((memberId) => {
                      const user = getUserById(memberId);
                      return user ? (
                        <div key={memberId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{user.displayName}</span>
                            <span className="text-sm text-gray-500 ml-2">({user.email})</span>
                          </div>
                          <button
                            onClick={() => selectedGroup && handleRemoveMember(selectedGroup.id, memberId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <UserMinusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* 사용 가능한 사용자 */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">추가 가능한 사용자</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedGroup && getAvailableUsers(selectedGroup).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{user.displayName}</span>
                          <span className="text-sm text-gray-500 ml-2">({user.email})</span>
                        </div>
                        <button
                          onClick={() => handleAddMember(selectedGroup.id, user.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <UserPlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  닫기
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default GroupManagement;