// ============================================================
// Treehole — 树洞页（默认首页）
// 每次对话是独立会话，但 AI 会引用历史洞察
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Session, Message, Insight } from '../types';
import ChatBubble from '../components/ChatBubble';
import InsightCard from '../components/InsightCard';
import InputArea from '../components/InputArea';
import { useChat, autoTitle } from '../hooks/useChat';
import { sendMessage } from '../services/ai';
import { compileInsight } from '../services/compiler';
import { getInsights } from '../utils/storage';

interface TreeholeProps {
  apiKey: string;
  model: 'deepseek-chat' | 'deepseek-reasoner';
  onNewInsight: () => void;
}

export default function Treehole({ apiKey, model, onNewInsight }: TreeholeProps) {
  // 树洞每次都是新会话
  const [session, setSession] = useState<Session>(() => createTreeholeSession());
  const [insights, setInsights] = useState<Insight[]>(() =>
    getInsights().filter((i) => i.status === 'active').slice(-5),
  );
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    streamingContent,
    error,
    send,
    clearError,
  } = useChat({
    apiKey,
    model,
    session,
    onNewInsight: () => {
      onNewInsight();
      setInsights(getInsights().filter((i) => i.status === 'active').slice(-5));
    },
  });

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // 自动生成标题
  useEffect(() => {
    if (messages.length === 2 && messages[0]?.role === 'user' && apiKey) {
      autoTitle(apiKey, model, messages[0].content).then((title) => {
        setSession((prev) => ({ ...prev, title }));
      });
    }
  }, [messages.length, apiKey, model]);

  // 新树洞
  const handleNewTreehole = useCallback(() => {
    setSession(createTreeholeSession());
  }, []);

  // 转入深度对话
  const handleGoDeep = useCallback(() => {
    // 通过 sessionStorage 传递当前树洞的消息到深度对话页
    sessionStorage.setItem('truth_ai_treehole_bridge', JSON.stringify({
      session,
      messages,
    }));
    window.location.hash = '#/deepchat?from=treehole';
  }, [session, messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            🪞 树洞
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {session.title === '新的树洞' ? '把你想说的都倒出来' : session.title}
          </p>
        </div>
        <button
          onClick={handleNewTreehole}
          disabled={isLoading}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          + 新的树洞
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <span className="text-5xl mb-4">🪞</span>
            <p className="text-sm">这里是你的树洞</p>
            <p className="text-xs mt-1 text-gray-600">想说什么都可以——我会给你分析，不是安慰</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            onInsightClick={(id) => setExpandedInsight(id === expandedInsight ? null : id)}
          />
        ))}

        {/* 流式内容 */}
        {streamingContent && (
          <div className="flex justify-start my-3">
            <div className="max-w-[85%] sm:max-w-[75%] bg-gray-800/80 text-gray-100 rounded-2xl rounded-bl-md border border-gray-700/50 px-4 py-3 text-sm whitespace-pre-wrap break-words">
              {streamingContent}
              <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
            </div>
          </div>
        )}

        {/* Loading indicator (before first chunk) */}
        {isLoading && !streamingContent && (
          <div className="flex justify-start my-3">
            <div className="bg-gray-800/80 text-gray-400 rounded-2xl rounded-bl-md px-4 py-3 text-sm flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-center my-3">
            <div className="bg-red-900/30 border border-red-800/50 text-red-300 text-sm px-4 py-2 rounded-lg text-center">
              <p>{error}</p>
              <button
                onClick={clearError}
                className="text-xs mt-1 underline underline-offset-2 hover:text-red-200"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        {/* 洞察卡片：在对话中展示 */}
        {messages.length > 0 && insights.length > 0 && (
          <div className="my-4 space-y-2">
            <p className="text-[11px] text-gray-600 uppercase tracking-wider px-1">最近的洞察</p>
            {insights.slice(-2).map((insight) => (
              <div key={insight.id}>
                <InsightCard
                  insight={insight}
                  compact={expandedInsight !== insight.id}
                  onClick={(id) => setExpandedInsight(id === expandedInsight ? null : id)}
                />
              </div>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 转入深度对话 */}
      {messages.length >= 4 && (
        <div className="shrink-0 px-4 py-2 border-t border-gray-800/50 bg-gray-900/50">
          <button
            onClick={handleGoDeep}
            className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 py-2 rounded-lg border border-dashed border-indigo-500/30 hover:border-indigo-500/60 transition-colors"
          >
            💬 这个话题值得深入 — 转入深度对话 →
          </button>
        </div>
      )}

      {/* Input */}
      <InputArea
        onSend={send}
        disabled={isLoading || !apiKey}
        placeholder="把你想说的都说出来…"
      />
    </div>
  );
}

function createTreeholeSession(): Session {
  const now = new Date().toISOString();
  return {
    id: `th_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'treehole',
    title: '新的树洞',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}
