import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, PhotoIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import { useDeviceType } from '../../hooks/useDeviceType';

interface MobileChatInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MobileChatInput: React.FC<MobileChatInputProps> = ({
  onSendMessage,
  placeholder = '메시지를 입력하세요...',
  disabled = false,
}) => {
  const { isMobile } = useDeviceType();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojis = ['😀', '😂', '😊', '😍', '🤔', '😉', '👍', '👎', '❤️', '🔥', '💯', '🎉'];

  useEffect(() => {
    if (textareaRef.current && isMobile) {
      const textarea = textareaRef.current; // Store ref value

      // 모바일에서 키보드 높이에 따라 조정
      const handleResize = () => {
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        }
      };

      textarea.addEventListener('input', handleResize);
      return () => {
        textarea.removeEventListener('input', handleResize);
      };
    }
  }, [isMobile]);

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
      setShowEmoji(false);

      // 모바일에서 키보드 숨기기
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmoji(false);
  };

  return (
    <div className={`border-t border-gray-200 bg-white p-4 ${isMobile ? 'pb-safe' : ''}`}>
      {/* 첨부 파일 미리보기 */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div key={index} className="relative">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-16 w-16 object-cover rounded-lg border"
                />
              ) : (
                <div className="h-16 w-16 bg-gray-100 rounded-lg border flex items-center justify-center">
                  <span className="text-xs text-gray-500">📄</span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 이모지 선택기 */}
      {showEmoji && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-6 gap-2">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="text-2xl hover:bg-gray-200 rounded p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex items-end space-x-2">
        {/* 파일 첨부 버튼 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          disabled={disabled}
        >
          <PhotoIcon className="h-5 w-5" />
        </button>

        {/* 이모지 버튼 */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={`p-2 rounded-full hover:bg-gray-100 ${
            showEmoji ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
          disabled={disabled}
        >
          <FaceSmileIcon className="h-5 w-5" />
        </button>

        {/* 텍스트 입력 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`w-full px-4 py-2 border border-gray-300 rounded-full resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isMobile ? 'max-h-32' : 'max-h-20'
            }`}
            style={{
              minHeight: isMobile ? '40px' : '36px',
              height: 'auto',
            }}
          />
        </div>

        {/* 전송 버튼 */}
        <button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          className={`p-2 rounded-full ${
            message.trim() || attachments.length > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,application/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default MobileChatInput;