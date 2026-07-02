// ============================================================
// ChatBubble — 消息气泡（用户 / AI / 系统三种样式）
// ============================================================

import type { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  onInsightClick?: (insightId: string) => void;
}

export default function ChatBubble({ message, onInsightClick }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-gray-800/60 text-gray-400 text-xs px-4 py-1.5 rounded-full max-w-md text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} my-3`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-indigo-600/80 text-white rounded-br-md'
            : 'bg-gray-800/80 text-gray-100 rounded-bl-md border border-gray-700/50'
        }`}
      >
        <div className="text-[15px]">{message.content}</div>

        {message.insightId && (
          <button
            onClick={() => onInsightClick?.(message.insightId!)}
            className="mt-2 text-xs text-indigo-300 hover:text-indigo-200 underline underline-offset-2 transition-colors"
          >
            💡 查看相关洞察 →
          </button>
        )}

        <div className={`text-[10px] mt-1.5 ${isUser ? 'text-indigo-200/60' : 'text-gray-500'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}
