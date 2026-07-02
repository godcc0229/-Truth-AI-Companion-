// ============================================================
// localStorage 封装 + 版本迁移
// ============================================================

import type { AppState, Session, Insight, ModelName } from '../types';

const STORAGE_VERSION = 1;
const STORAGE_KEYS = {
  version: 'truth_ai_version',
  apiKey: 'truth_ai_api_key',
  model: 'truth_ai_model',
  sessions: 'truth_ai_sessions',
  insights: 'truth_ai_insights',
  currentSessionId: 'truth_ai_current_session',
} as const;

// ---- 版本迁移 ----
function migrate(): void {
  const version = localStorage.getItem(STORAGE_KEYS.version);
  if (!version) {
    // 首次使用，写入版本号
    localStorage.setItem(STORAGE_KEYS.version, String(STORAGE_VERSION));
    return;
  }

  const v = parseInt(version, 10);
  if (v < STORAGE_VERSION) {
    // 预留：未来版本迁移逻辑
    localStorage.setItem(STORAGE_KEYS.version, String(STORAGE_VERSION));
  }
}

migrate();

// ---- 读写封装 ----

export function getApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEYS.apiKey);
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEYS.apiKey, key);
}

export function removeApiKey(): void {
  localStorage.removeItem(STORAGE_KEYS.apiKey);
}

export function getModel(): ModelName {
  return (localStorage.getItem(STORAGE_KEYS.model) as ModelName) || 'deepseek-chat';
}

export function setModel(model: ModelName): void {
  localStorage.setItem(STORAGE_KEYS.model, model);
}

export function getSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sessions);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
}

export function getCurrentSessionId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.currentSessionId);
}

export function setCurrentSessionId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.currentSessionId, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentSessionId);
  }
}

export function getInsights(): Insight[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.insights);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveInsights(insights: Insight[]): void {
  localStorage.setItem(STORAGE_KEYS.insights, JSON.stringify(insights));
}

// ---- 快捷操作 ----

export function loadAppState(): Pick<AppState, 'apiKey' | 'model' | 'sessions' | 'insights' | 'currentSessionId'> {
  return {
    apiKey: getApiKey(),
    model: getModel(),
    sessions: getSessions(),
    insights: getInsights(),
    currentSessionId: getCurrentSessionId(),
  };
}

/** 清空所有数据 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
