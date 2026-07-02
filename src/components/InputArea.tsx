// ============================================================
// InputArea — 输入框（Enter 发送，Shift+Enter 换行）
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';

interface InputAreaProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function InputArea({ onSend, disabled = false, placeholder = '说点什么…' }: InputAreaProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    // 重置高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 发送后重新聚焦
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  return (
    <div className="border-t border-gray-800 bg-gray-900/95 px-3 py-2.5 safe-area-bottom">
      <div className="max-w-2xl mx-auto flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors max-h-40"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
            disabled || !value.trim()
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95'
          }`}
        >
          📤
        </button>
      </div>
      <div className="max-w-2xl mx-auto mt-1">
        <p className="text-[10px] text-gray-600 px-1">
          Enter 发送 · Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}
