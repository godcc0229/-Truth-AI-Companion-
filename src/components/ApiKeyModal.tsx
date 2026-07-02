// ============================================================
// ApiKeyModal — API Key 设置弹窗（首次必填）
// ============================================================

import { useState, useEffect, useRef } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  currentKey: string | null;
  onSave: (key: string) => void;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, currentKey, onSave, onClose }: ApiKeyModalProps) {
  const [key, setKey] = useState(currentKey || '');
  const [showKey, setShowKey] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setKey(currentKey || '');
      // 自动聚焦输入框
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, currentKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = key.trim();
    if (trimmed) {
      onSave(trimmed);
    }
  };

  const canClose = !!currentKey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in">
        <div className="text-center mb-6">
          <span className="text-4xl">🔑</span>
          <h2 className="text-xl font-bold mt-2">设置 API Key</h2>
          <p className="text-gray-400 text-sm mt-1">
            Truth AI 需要你的 DeepSeek API Key 才能运行。
            <br />
            所有数据存储在你的浏览器中，不会上传到任何服务器。
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">DeepSeek API Key</label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="sk-..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-sm"
                tabIndex={-1}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400 space-y-1">
            <p>💡 <strong className="text-gray-300">没有 API Key？</strong></p>
            <p>
              前往{' '}
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                platform.deepseek.com
              </a>{' '}
              注册并获取 Key。
            </p>
            <p>新用户通常有免费额度，够用很久。</p>
          </div>

          <div className="flex gap-3 pt-2">
            {canClose && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm hover:bg-gray-800 transition-colors"
              >
                取消
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!key.trim()}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                key.trim()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98]'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              保存并开始使用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
