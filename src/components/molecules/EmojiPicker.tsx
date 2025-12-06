import React, { useState } from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const emojis = [
    '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯',
    '👏', '🙌', '🤔', '😅', '😉', '😊', '😍', '🥰', '🤗', '🤩'
  ];

  return (
    <div className="absolute bottom-full mb-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-large p-3 z-50 animate-slide-in">
      <div className="grid grid-cols-5 gap-2">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-xl transition-all duration-200 hover:scale-110"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;