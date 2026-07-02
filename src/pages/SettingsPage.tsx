// ============================================================
// SettingsPage — 设置页（API Key 管理、模型选择、数据清除）
// ============================================================

import { useState } from 'react';
import type { ModelName } from '../types';
import { clearAllData } from '../utils/storage';
import InsightCard from '../components/InsightCard';
import { getInsights, archiveInsight as archiveInsightStorage } from '../services/compiler';

interface SettingsPageProps {
  apiKey: string | null;
  model: ModelName;
  onApiKeyChange: (key: string | null) => void;
  onModelChange: (model: ModelName) => void;
}

export default function SettingsPage({ apiKey, model, onApiKeyChange, onModelChange }: SettingsPageProps) {
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [insights, setInsights] = useState<ReturnType<typeof getInsights>>(() => getInsights());

  const handleSaveKey = () => {
    const trimmed = newKey.trim();
    if (trimmed) {
      onApiKeyChange(trimmed);
      setNewKey('');
      setShowKeyInput(false);
    }
  };

  const handleRemoveKey = () => {
    onApiKeyChange(null);
  };

  const handleClearData = () => {
    clearAllData();
    setShowClearConfirm(false);
    setInsights([]);
    // 刷新页面以重置所有状态
    window.location.hash = '#/treehole';
    window.location.reload();
  };

  const handleArchive = (id: string) => {
    archiveInsightStorage(id);
    setInsights(getInsights());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
      <header className="shrink-0 px-4 py-3 border-b border-gray-800">
        <h1 className="text-lg font-bold flex items-center gap-2">⚙️ 设置</h1>
      </header>

      <div className="flex-1 px-4 py-6 space-y-8 max-w-lg">
        {/* API Key */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">🔑 API Key</h2>
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
            {apiKey ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-sm">✅</span>
                  <span className="text-sm text-gray-300">已设置</span>
                  <code className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400">
                    {apiKey.slice(0, 8)}...{apiKey.slice(-4)}
                  </code>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowKeyInput(true)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    更换
                  </button>
                  <button
                    onClick={handleRemoveKey}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                  >
                    移除
                  </button>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-400 mb-2">尚未设置 API Key</p>
                <button
                  onClick={() => setShowKeyInput(true)}
                  className="text-xs px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                >
                  设置 API Key
                </button>
              </div>
            )}

            {showKeyInput && (
              <div className="space-y-2 pt-2">
                <input
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                  placeholder="sk-..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveKey}
                    disabled={!newKey.trim()}
                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setShowKeyInput(false);
                      setNewKey('');
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <p className="text-[10px] text-gray-600">
              前往 platform.deepseek.com 获取 API Key。你的 Key 仅存储在浏览器本地。
            </p>
          </div>
        </section>

        {/* Model */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">🤖 模型选择</h2>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex gap-2">
              {([
                ['deepseek-chat', 'DeepSeek Chat', '快速响应，适合对话'],
                ['deepseek-reasoner', 'DeepSeek R1', '深度推理，分析更深入（较慢）'],
              ] as const).map(([value, label, desc]) => (
                <button
                  key={value}
                  onClick={() => onModelChange(value)}
                  className={`flex-1 text-left p-3 rounded-lg border transition-all ${
                    model === value
                      ? 'border-indigo-500 bg-indigo-600/10 text-indigo-300'
                      : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-[10px] opacity-60 mt-1">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 洞察管理 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">🧠 洞察管理</h2>
          <div className="space-y-2">
            {insights.length === 0 ? (
              <p className="text-sm text-gray-600 bg-gray-800/30 rounded-xl p-4 text-center">
                暂无洞察。开始对话后，AI 会自动发现你的行为模式。
              </p>
            ) : (
              insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  compact
                  onArchive={handleArchive}
                />
              ))
            )}
          </div>
        </section>

        {/* 数据清除 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">🗑️ 数据管理</h2>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-3">
              清除所有对话记录、洞察和设置数据。此操作不可恢复。
            </p>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs px-4 py-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
              >
                清除所有数据
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleClearData}
                  className="text-xs px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
                >
                  确认清除
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-xs px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-[10px] text-gray-700 pb-8">
          <p>Truth AI Companion v1.0</p>
          <p className="mt-0.5">纯前端 · 隐私优先 · 数据不上传</p>
        </div>
      </div>
    </div>
  );
}
