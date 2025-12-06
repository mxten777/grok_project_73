import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMention: (userId: string, username: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  placeholder?: string;
  className?: string;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onMention,
  onTypingStart,
  onTypingStop,
  placeholder = "메시지를 입력하세요...",
  className = ""
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 모의 사용자 목록 (실제로는 API에서 가져와야 함)
  const mockUsers: User[] = [
    { id: 'user-1', email: 'john@example.com', displayName: 'John Doe', role: 'employee', createdAt: new Date(), updatedAt: new Date(), permissions: [] },
    { id: 'user-2', email: 'jane@example.com', displayName: 'Jane Smith', role: 'manager', createdAt: new Date(), updatedAt: new Date(), permissions: [] },
    { id: 'user-3', email: 'bob@example.com', displayName: 'Bob Johnson', role: 'admin', createdAt: new Date(), updatedAt: new Date(), permissions: [] },
  ];

  const filteredUsers = mockUsers.filter(user =>
    user.displayName.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(cursorPos);

    // Start typing
    if (onTypingStart) {
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (onTypingStop) {
        onTypingStop();
      }
    }, 1000); // Stop typing after 1 second of inactivity

    // @ 입력 감지
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const query = textBeforeCursor.substring(atIndex + 1);
      if (!query.includes(' ')) {
        setMentionQuery(query);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user: User) => {
    const textBeforeAt = value.substring(0, cursorPosition - mentionQuery.length - 1);
    const textAfterCursor = value.substring(cursorPosition);
    const newText = `${textBeforeAt}@${user.displayName} ${textAfterCursor}`;

    onChange(newText);
    setShowMentions(false);

    // 커서 위치 조정
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = textBeforeAt.length + user.displayName.length + 2;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {/* Mention Dropdown */}
      {showMentions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full mb-2 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-large max-h-48 overflow-y-auto z-50 animate-slide-in">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => handleMentionSelect(user)}
              className="w-full px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.displayName.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                  {user.displayName}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {user.email}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;