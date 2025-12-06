import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { PaperAirplaneIcon, PlusIcon, ChatBubbleLeftIcon, UsersIcon, MegaphoneIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import MessageItem from '../components/molecules/MessageItem';
import MentionInput from '../components/molecules/MentionInput';
import { messageService } from '../firebase/services';

const Messenger: React.FC = () => {
  const { user } = useAuth();
  const {
    chats,
    currentChat,
    messages,
    loading,
    loadChats,
    selectChat,
    sendMessage,
    createChat,
    markAsRead,
    startTyping,
    stopTyping,
    uploadFile,
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('Messenger: Component rendered', { user, chats, loading, currentChat, messages });

  // Debug info
  useEffect(() => {
    console.log('Messenger: useEffect triggered', { user: user?.uid });
  }, [user]);

  // Initial loading of chats
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChat) return;

    try {
      await sendMessage(messageInput.trim());
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('메시지 전송에 실패했습니다.');
    }
  };

  const handleCreateSampleData = async () => {
    // 샘플 데이터 생성 로직 (필요시 구현)
    console.log('Creating sample data...');
  };

  const handleCreateChat = async (type: 'direct' | 'group' | 'notice') => {
    try {
      const participants = ['dev-user-123', 'user-1']; // 샘플 참가자
      const name = type === 'direct' ? undefined : `${type} 채팅`;
      await createChat(participants, name, type);
      setShowNewChat(false);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChat) return;

    try {
      const fileUrl = await uploadFile(file);
      const fileType = file.type.startsWith('image/') ? 'image' : 'file';
      await sendMessage(file.name, fileType, fileUrl);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('파일 업로드에 실패했습니다.');
    }
  };

  const handleTestConnection = async () => {
    try {
      console.log('Testing Firestore connection...');
      const testDoc = await getDocs(collection(db, 'chats'));
      console.log('Connection test successful, docs count:', testDoc.docs.length);
      alert(`Firestore 연결 성공! ${testDoc.docs.length}개의 문서가 있습니다.`);
    } catch (error) {
      console.error('Connection test failed:', error);
      alert(`Firestore 연결 실패: ${error}`);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!user?.uid) return;

    try {
      console.log('Adding reaction:', messageId, emoji);
      // Firestore 업데이트
      await messageService.updateMessage(messageId, {
        reactions: {
          [emoji]: [...(messages.find(m => m.id === messageId)?.reactions[emoji] || []), user.uid]
        }
      });
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!user?.uid) return;

    try {
      console.log('Removing reaction:', messageId, emoji);
      // Firestore 업데이트
      const currentReactions = messages.find(m => m.id === messageId)?.reactions[emoji] || [];
      const updatedReactions = currentReactions.filter(id => id !== user.uid);
      await messageService.updateMessage(messageId, {
        reactions: {
          [emoji]: updatedReactions
        }
      });
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  const getChatIcon = (type: string) => {
    switch (type) {
      case 'direct':
        return <ChatBubbleLeftIcon className="h-5 w-5" />;
      case 'group':
        return <UsersIcon className="h-5 w-5" />;
      case 'notice':
        return <MegaphoneIcon className="h-5 w-5" />;
      default:
        return <ChatBubbleLeftIcon className="h-5 w-5" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-full bg-gray-50 w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Chat List Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out lg:transform-none ${
        showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">메신저</h2>
            <div className="flex items-center space-x-2">
              {loading && <div className="text-xs text-gray-500">로딩중...</div>}
              <button
                onClick={handleTestConnection}
                className="hidden sm:inline-flex px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                연결 테스트
              </button>
              <button
                onClick={handleCreateSampleData}
                className="hidden sm:inline-flex px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                샘플 추가
              </button>
              <button
                onClick={() => loadChats()}
                className="hidden sm:inline-flex px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                새로고침
              </button>
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="mt-3 space-y-2 sm:hidden">
            <button
              onClick={handleTestConnection}
              className="w-full px-3 py-2 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              연결 테스트
            </button>
            <button
              onClick={handleCreateSampleData}
              className="w-full px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              샘플 추가
            </button>
            <button
              onClick={() => loadChats()}
              className="w-full px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              새로고침
            </button>
          </div>

          {showNewChat && (
            <div className="mt-3 space-y-2">
              <button
                onClick={() => handleCreateChat('direct')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                1:1 채팅 시작
              </button>
              <button
                onClick={() => handleCreateChat('group')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                그룹 채팅 생성
              </button>
              <button
                onClick={() => handleCreateChat('notice')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                공지방 생성
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">로딩중...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              채팅방이 없습니다. 새 채팅을 시작해보세요.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`w-full p-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                    currentChat?.id === chat.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {getChatIcon(chat.type)}
                      </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {chat.name || `${chat.participants.length}명의 채팅`}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {chat.type === 'notice' ? '공지사항' :
                         chat.type === 'group' ? '그룹 채팅' : '개인 채팅'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex items-center">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="lg:hidden p-2 mr-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  <Bars3Icon className="h-5 w-5" />
                </button>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  {getChatIcon(currentChat.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                    {currentChat.name || `${currentChat.participants.length}명의 채팅`}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {currentChat.type === 'notice' ? '공지사항' :
                     currentChat.type === 'group' ? '그룹 채팅' : '개인 채팅'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Typing Indicator */}
              {currentChat?.typingUsers && currentChat.typingUsers.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-500 animate-pulse">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>
                    {currentChat.typingUsers.length === 1
                      ? '누군가가 입력 중...'
                      : `${currentChat.typingUsers.length}명이 입력 중...`}
                  </span>
                </div>
              )}

              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === user?.uid}
                  onAddReaction={handleAddReaction}
                  onRemoveReaction={handleRemoveReaction}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-3 sm:p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2 sm:space-x-4">
                <div className="flex-1 flex items-center space-x-2">
                  <label className="cursor-pointer">
                    <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                    />
                  </label>
                  <MentionInput
                    value={messageInput}
                    onChange={setMessageInput}
                    onMention={(userId, username) => {
                      // 멘션 처리 로직 (필요시 구현)
                      console.log('Mention:', userId, username);
                    }}
                    onTypingStart={startTyping}
                    onTypingStop={stopTyping}
                    placeholder="메시지를 입력하세요... (@로 멘션)"
                    className="flex-1 input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="btn btn-primary px-3 sm:px-6 py-2"
                >
                  <PaperAirplaneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">채팅방을 선택하세요</h3>
              <p className="mt-1 text-sm text-gray-500">
                왼쪽 목록에서 채팅방을 선택하거나 새 채팅을 시작하세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;