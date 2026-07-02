// ============================================================
// Truth AI Companion — Core Type Definitions
// ============================================================

/** AI 模型选项 */
export type ModelName = 'deepseek-chat' | 'deepseek-reasoner';

/** 洞察类型 */
export type InsightType = 'pattern' | 'blindspot' | 'reframe' | 'action';

/** 洞察状态 */
export type InsightStatus = 'active' | 'archived';

/** 会话类型 */
export type SessionType = 'treehole' | 'deepchat';

/** 消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system';

// ---- 消息 ----
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  insightId?: string;   // AI 消息关联的洞察卡片 id
  timestamp: string;    // ISO 8601
}

// ---- 洞察 ----
export interface Insight {
  id: string;
  title: string;
  type: InsightType;

  source: {
    conversationId: string;
    quote: string;      // 用户原话作为证据
  };

  content: string;       // 核心洞察，≤100字
  linkedTo: string[];    // 交叉引用其他洞察 id
  createdAt: string;     // ISO 8601
  status: InsightStatus;
}

// ---- 会话 ----
export interface Session {
  id: string;
  type: SessionType;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// ---- 应用全局状态 ----
export interface AppState {
  // API
  apiKey: string | null;
  model: ModelName;

  // 对话
  currentSessionId: string | null;
  sessions: Session[];

  // 知识库
  insights: Insight[];

  // UI
  isApiKeyModalOpen: boolean;
}

// ---- AI API 相关 ----
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ParsedAIResponse {
  body: string;           // 去掉 [INSIGHT] 块的正文
  insight: Omit<Insight, 'id' | 'createdAt' | 'status'> | null;
}

// ---- 场景检测结果 ----
export type ScenarioMode = 'vent' | 'analyze' | 'mirror' | 'path';

export interface ScenarioResult {
  mode: ScenarioMode;
  confidence: number;
}
