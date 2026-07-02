// ============================================================
// DeepChat — 深度对话页
// 连续会话，保留完整历史，AI 主动引用洞察
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Session, Insight } from '../types';
import ChatBubble from '../components/ChatBubble';
import InsightCard from '../components/InsightCard';
import InputArea from '../components/InputArea';
import { useChat, autoTitle } from '../hooks/useChat';
import { getInsights, getSessions, saveSessions } from '../utils/storage';

interface DeepChatProps {
  apiKey: string;
  model: 'deepseek-chat' | 'deepseek-reasoner';
  onNewInsight: () => void;
}

export default function DeepChat({ apiKey, model, onNewInsight }: DeepChatProps) {
  const [sessions, setSessions] = useState<Session[]>(() =>
    getSessions().filter((s) => s.type === 'deepchat'),
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    () => sessions[0]?.id || null,
  );
  const [insights, setInsights] = useState<Insight[]>(() =>
    getInsights().filter((i) => i.status === 'active'),
  );
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [showSessionList, setShowSessionList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  const {
    messages,
    isLoading,
    streamingContent,
    error,
    send,
    clearError,
    createSession,
  } = useChat({
    apiKey,
    model,
    session: activeSession,
    onNewInsight: () => {
      onNewInsight();
      setInsights(getInsights().filter((i) => i.status === 'active'));
    },
  });

  // 检查是否有从树洞传来的数据
  useEffect(() => {
    const bridgeData = sessionStorage.getItem('truth_ai_treehole_bridge');
    if (bridgeData) {
      try {
        const { session: treeholeSession, messages: treeholeMessages } = JSON.parse(bridgeData);
        sessionStorage.removeItem('truth_ai_treehole_bridge');

        // 创建新的深度对话会话，继承树洞的消息
        const now = new Date().toISOString();
        const newSession: Session = {
          id: `dc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          type: 'deepchat',
          title: treeholeSession.title !== '新的树洞' ? treeholeSession.title : '深度对话',
          messages: treeholeMessages,
          createdAt: now,
          updatedAt: now,
        };

        const updatedSessions = [newSession, ...sessions];
        setSessions(updatedSessions);
        setActiveSessionId(newSession.id);
        saveSessions(updatedSessions);
      } catch {
        // ignore
      }
    }
  }, []);

  // 同步 sessions 到 localStorage
  useEffect(() => {
    if (activeSession && messages.length > 0) {
      const updated = sessions.map((s) =>
        s.id === activeSession.id
          ? { ...s, messages, updatedAt: new Date().toISOString() }
          : s,
      );
      setSessions(updated);
      saveSessions(updated);
    }
  }, [messages, activeSession?.id]);

  // 自动生成标题
  useEffect(() => {
    if (
      activeSession &&
      messages.length === 2 &&
      messages[0]?.role === 'user' &&
      activeSession.title === '新对话' &&
      apiKey
    ) {
      autoTitle(apiKey, model, messages[0].content).then((title) => {
        setSessions((prev) => {
          const updated = prev.map((s) => (s.id === activeSession.id ? { ...s, title } : s));
          saveSessions(updated);
          return updated;
        });
      });
    }
  }, [messages.length, apiKey, model, activeSession?.id]);

  // 启动新对话
  const handleNewChat = useCallback(() => {
    const session = createSession('deepchat');
    const updated = [session, ...sessions];
    setSessions(updated);
    setActiveSessionId(session.id);
    saveSessions(updated);
    setShowSessionList(false);
  }, [sessions, createSession]);

  // 切换对话
  const handleSwitchSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setShowSessionList(false);
  }, []);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // 关联当前对话的洞察
  const relatedInsights = insights.filter((i) =>
    activeSession?.messages.some((m) => m.insightId === i.id),
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSessionList(!showSessionList)}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            ☰
          </button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              💬 {activeSession?.title || '深度对话'}
            </h1>
            <p className="text-xs text-gray-500">
              {activeSession ? `${activeSession.messages.length} 条消息` : '选择一个对话'}
            </p>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          disabled={isLoading}
          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition-colors disabled:opacity-40"
        >
          + 新对话
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {!activeSession && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <span className="text-5xl mb-4">💬</span>
                <p className="text-sm">深度对话模式</p>
                <p className="text-xs mt-1 text-gray-600">连续对话，保留完整上下文。AI 会主动引用历史洞察。</p>
                <button
                  onClick={handleNewChat}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors"
                >
                  开始新对话
                </button>
              </div>
            )}

            {activeSession && messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <span className="text-3xl mb-3">💬</span>
                <p className="text-sm">开始你的深度对话</p>
                <p className="text-xs mt-1 text-gray-600">我会记住之前的所有对话，帮你发现行为模式</p>
              </div>
            )}

            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                onInsightClick={(id) => setExpandedInsight(id === expandedInsight ? null : id)}
              />
            ))}

            {streamingContent && (
              <div className="flex justify-start my-3">
                <div className="max-w-[85%] sm:max-w-[75%] bg-gray-800/80 text-gray-100 rounded-2xl rounded-bl-md border border-gray-700/50 px-4 py-3 text-sm whitespace-pre-wrap break-words">
                  {streamingContent}
                  <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
                </div>
              </div>
            )}

            {isLoading && !streamingContent && (
              <div className="flex justify-start my-3">
                <div className="bg-gray-800/80 text-gray-400 rounded-2xl rounded-bl-md px-4 py-3 text-sm flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

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

            <div ref={messagesEndRef} />
          </div>

          <InputArea
            onSend={send}
            disabled={isLoading || !apiKey || !activeSession}
            placeholder={activeSession ? '继续深入讨论…' : '先创建一个对话'}
          />
        </div>

        {/* Desktop sidebar: 关联洞察 */}
        {relatedInsights.length > 0 && (
          <aside className="hidden lg:block w-72 border-l border-gray-800 overflow-y-auto p-4 shrink-0">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">关联洞察</h3>
            <div className="space-y-2">
              {relatedInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  compact
                  onClick={(id) => setExpandedInsight(id === expandedInsight ? null : id)}
                />
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Session list overlay */}
      {showSessionList && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowSessionList(false)}
          />
          <div className="relative bg-gray-900 border-r border-gray-800 w-80 max-w-[85vw] h-full overflow-y-auto p-4 animate-slide-in">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">对话列表</h3>
            <div className="space-y-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSwitchSession(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    s.id === activeSessionId
                      ? 'bg-indigo-600/20 text-indigo-300'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  <div className="truncate">{s.title}</div>
                  <div className="text-[10px] opacity-50 mt-0.5">
                    {s.messages.length} 条消息 · {formatDate(s.updatedAt)}
                  </div>
                </button>
              ))}
              {sessions.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-8">还没有对话</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return '';
  }
}
