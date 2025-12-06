import React, { useState } from 'react';
import { PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import EmojiPicker from '../molecules/EmojiPicker';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  onAddReaction,
  onRemoveReaction,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const renderMessageContent = (content: string) => {
    // @멘션 패턴 찾기
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // 매치 이전 텍스트 추가
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
        });
      }

      // 멘션 부분 추가
      parts.push({
        type: 'mention',
        content: match[0],
        username: match[1],
      });

      lastIndex = match.index + match[0].length;
    }

    // 남은 텍스트 추가
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }

    return parts.map((part, index) => {
      if (part.type === 'mention') {
        return (
          <span
            key={index}
            className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-1 py-0.5 rounded font-medium"
          >
            {part.content}
          </span>
        );
      }
      return <span key={index}>{part.content}</span>;
    });
  };

  const handleReactionClick = (emoji: string) => {
    const hasReacted = message.reactions[emoji]?.includes('dev-user-123'); // 현재 사용자 ID

    if (hasReacted) {
      onRemoveReaction(message.id, emoji);
    } else {
      onAddReaction(message.id, emoji);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className="max-w-xs lg:max-w-md relative">
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-primary-500 text-white'
              : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700'
          }`}
        >
          {message.type === 'image' && message.fileUrl ? (
            <div className="space-y-2">
              <img
                src={message.fileUrl}
                alt={message.content}
                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                onClick={() => window.open(message.fileUrl, '_blank')}
              />
              <p className="text-sm">{renderMessageContent(message.content)}</p>
            </div>
          ) : message.type === 'file' && message.fileUrl ? (
            <div className="space-y-2">
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-2 p-2 rounded-lg border ${
                  isOwn
                    ? 'bg-primary-400 border-primary-300 text-white hover:bg-primary-300'
                    : 'bg-neutral-50 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-600'
                }`}
              >
                <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-600 rounded flex items-center justify-center">
                  📎
                </div>
                <div>
                  <p className="text-sm font-medium">{message.content}</p>
                  <p className="text-xs opacity-75">파일 다운로드</p>
                </div>
              </a>
              {message.content && <p className="text-sm">{renderMessageContent(message.content)}</p>}
            </div>
          ) : (
            <p className="text-sm">{renderMessageContent(message.content)}</p>
          )}
          <div className="flex items-center justify-end gap-1 mt-1">
            <p
              className={`text-xs ${
                isOwn ? 'text-primary-100' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {formatTime(message.createdAt)}
            </p>
            {isOwn && message.readBy.length > 1 && (
              <CheckIcon className="w-3 h-3 text-primary-200" />
            )}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 animate-fade-in">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              users.length > 0 && (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-all duration-200 hover:scale-105 ${
                    users.includes('dev-user-123')
                      ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 shadow-soft'
                      : 'bg-neutral-100 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                  }`}
                >
                  <span className="text-sm">{emoji}</span>
                  <span className="font-medium">{users.length}</span>
                </button>
              )
            ))}
          </div>
        )}

        {/* Add Reaction Button */}
        <div className={`absolute top-0 ${isOwn ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-all duration-300`}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-10 h-10 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-soft hover:shadow-medium border border-neutral-200 dark:border-neutral-700"
          >
            <PlusIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>

          {showEmojiPicker && (
            <EmojiPicker
              onEmojiSelect={(emoji) => handleReactionClick(emoji)}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;