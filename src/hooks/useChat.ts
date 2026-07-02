// ============================================================
// 对话核心 Hook
// ============================================================

import { useState, useCallback, useRef } from 'react';
import type { Message, Session, SessionType, ModelName } from '../types';
import { sendMessage, generateSessionTitle } from '../services/ai';
import { compileInsight } from '../services/compiler';
import type { ChatMessage } from '../types';

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface UseChatOptions {
  apiKey: string;
  model: ModelName;
  session: Session | null;
  onNewInsight?: () => void;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  error: string | null;
  send: (content: string) => Promise<void>;
  retry: () => Promise<void>;
  clearError: () => void;
  createSession: (type: SessionType) => Session;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { apiKey, model, session, onNewInsight } = options;

  const [messages, setMessages] = useState<Message[]>(session?.messages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const lastMessageRef = useRef<string>('');

  // 切换 session 时重置 messages
  const sessionIdRef = useRef(session?.id);
  if (session?.id !== sessionIdRef.current) {
    sessionIdRef.current = session?.id;
    if (session?.messages !== messages) {
      setMessages(session?.messages || []);
    }
  }

  const createSession = useCallback((type: SessionType): Session => {
    const now = new Date().toISOString();
    return {
      id: generateSessionId(),
      type,
      title: type === 'treehole' ? '新的树洞' : '新对话',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  const send = useCallback(
    async (content: string) => {
      if (!apiKey) {
        setError('请先设置 API Key');
        return;
      }
      if (!content.trim()) return;
      if (!session) {
        setError('会话未初始化');
        return;
      }

      setError(null);
      setIsLoading(true);
      setStreamingContent('');

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // 构建历史消息
      const historyMessages: ChatMessage[] = updatedMessages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      // 移除最后一条（用户刚发的），因为 sendMessage 会再加上
      historyMessages.pop();

      try {
        let streamedText = '';

        const { parsed } = await sendMessage({
          apiKey,
          model,
          message: content.trim(),
          mode: session.type === 'treehole' ? 'treehole' : 'deepchat',
          historyMessages,
          onPartial: (chunk) => {
            streamedText += chunk;
            setStreamingContent(streamedText);
          },
        });

        const aiMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: parsed.body,
          timestamp: new Date().toISOString(),
        };

        // 编译洞察
        if (parsed.insight) {
          const insight = compileInsight(parsed, session.id);
          if (insight) {
            aiMessage.insightId = insight.id;
            onNewInsight?.();
          }
        }

        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        setStreamingContent('');
        lastMessageRef.current = content;
      } catch (err) {
        const msg = err instanceof Error ? err.message : '发送失败';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, model, session, messages, onNewInsight],
  );

  const retry = useCallback(async () => {
    if (lastMessageRef.current) {
      // 移除最后一条 AI 消息（如果存在）
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant') {
        setMessages(messages.slice(0, -1));
      }
      await send(lastMessageRef.current);
    }
  }, [messages, send]);

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    isLoading,
    streamingContent,
    error,
    send,
    retry,
    clearError,
    createSession,
  };
}

// 工具函数：为 session 生成标题
export async function autoTitle(
  apiKey: string,
  model: ModelName,
  firstMessage: string,
): Promise<string> {
  try {
    return await generateSessionTitle(apiKey, model, firstMessage);
  } catch {
    return '未命名对话';
  }
}
