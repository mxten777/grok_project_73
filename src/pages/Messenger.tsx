import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { PaperAirplaneIcon, PlusIcon, ChatBubbleLeftIcon, UsersIcon, MegaphoneIcon } from '@heroicons/react/24/outline';

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
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleCreateChat = async (type: 'direct' | 'group' | 'notice') => {
    try {
      // For demo purposes, create chat with system user
      // In real app, this should open a user selection dialog
      const systemUserId = 'system-user';
      const chatName = type === 'group' ? '새 그룹 채팅' :
                      type === 'notice' ? '공지사항' : '새 채팅';

      await createChat([systemUserId], chatName, type);
      setShowNewChat(false);
    } catch (error) {
      console.error('Failed to create chat:', error);
      alert('채팅방 생성에 실패했습니다.');
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
      {/* Chat List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">메신저</h2>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <PlusIcon className="h-5 w-5" />
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
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  {getChatIcon(currentChat.type)}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {currentChat.name || `${currentChat.participants.length}명의 채팅`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {currentChat.type === 'notice' ? '공지사항' :
                     currentChat.type === 'group' ? '그룹 채팅' : '개인 채팅'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === user?.uid
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.senderId === user?.uid ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
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