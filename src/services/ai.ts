// ============================================================
// ★ AI API 调用 + Prompt 组装
// ============================================================

import OpenAI from 'openai';
import type { ChatMessage, ParsedAIResponse, ModelName, ScenarioMode } from '../types';
import { detectScenario, buildSystemPrompt, buildL3Context } from '../config/personality';
import { getInsights } from '../utils/storage';

// ---- DeepSeek 客户端 ----
let client: OpenAI | null = null;

function getClient(apiKey: string): OpenAI {
  if (!client || client.apiKey !== apiKey) {
    client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com',
      dangerouslyAllowBrowser: true, // 纯前端直连
    });
  }
  return client;
}

// ---- Prompt 注入防御 ----
function sanitizeUserInput(input: string): string {
  return input
    .replace(/\[INSIGHT\]/gi, '［INSIGHT］')
    .replace(/\[\/INSIGHT\]/gi, '［/INSIGHT］');
}

// ---- 解析 AI 回复中的 [INSIGHT] 块 ----
function parseInsightBlock(text: string): ParsedAIResponse {
  const insightRegex = /\[INSIGHT\]\s*([\s\S]*?)\s*\[\/INSIGHT\]/i;
  const match = text.match(insightRegex);

  if (!match) {
    return { body: text.trim(), insight: null };
  }

  const body = text.replace(insightRegex, '').trim();

  try {
    const jsonStr = match[1].trim();
    const parsed = JSON.parse(jsonStr);

    return {
      body,
      insight: {
        title: String(parsed.title || '').slice(0, 15),
        type: ['pattern', 'blindspot', 'reframe', 'action'].includes(parsed.type)
          ? parsed.type
          : 'pattern',
        source: {
          conversationId: '',
          quote: '',
        },
        content: String(parsed.content || '').slice(0, 100),
        linkedTo: Array.isArray(parsed.linkedTo) ? parsed.linkedTo.slice(0, 5) : [],
      },
    };
  } catch {
    // JSON 解析失败，当作普通文本
    return { body: text.trim(), insight: null };
  }
}

// ---- 组装消息 ----
function buildMessages(
  userMessage: string,
  mode: 'treehole' | 'deepchat',
  historyMessages?: ChatMessage[],
): ChatMessage[] {
  const sanitized = sanitizeUserInput(userMessage);
  const scenario: ScenarioMode = detectScenario(sanitized);
  const insights = getInsights();

  // 提取最近的用户/AI消息用于 L3 上下文
  const recentForContext = (historyMessages || []).slice(-6).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const l3Context = buildL3Context(insights, recentForContext);
  const systemPrompt = buildSystemPrompt(scenario, mode, l3Context);

  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  // 添加历史消息（深度对话模式保留完整历史）
  if (historyMessages && historyMessages.length > 0) {
    messages.push(...historyMessages);
  }

  // 添加用户消息
  messages.push({ role: 'user', content: `[当前对话]\n用户：${sanitized}` });

  return messages;
}

// ---- 主调用函数 ----
export interface SendMessageOptions {
  apiKey: string;
  model: ModelName;
  message: string;
  mode: 'treehole' | 'deepchat';
  historyMessages?: ChatMessage[];
  onPartial?: (chunk: string) => void;
  signal?: AbortSignal;
}

export async function sendMessage(options: SendMessageOptions): Promise<{
  fullResponse: string;
  parsed: ParsedAIResponse;
}> {
  const { apiKey, model, message, mode, historyMessages, signal } = options;

  const openai = getClient(apiKey);
  const messages = buildMessages(message, mode, historyMessages);

  // 超时控制：30s
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  // 如果外部传了 signal，联动
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const stream = await openai.chat.completions.create(
      {
        model,
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      },
      { signal: controller.signal },
    );

    let fullResponse = '';

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        options.onPartial?.(delta);
      }
    }

    const parsed = parseInsightBlock(fullResponse);

    return { fullResponse, parsed };
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof Error) {
      if (err.name === 'AbortError' || err.message.includes('aborted')) {
        if (signal?.aborted) {
          throw new Error('请求已被取消');
        }
        throw new Error('思考超时，请重试');
      }
      // 尝试解析 API 错误
      const apiErr = err as { status?: number; code?: string };
      if (apiErr.status === 401 || apiErr.code === 'invalid_api_key') {
        throw new Error('API Key 无效，请检查后重试');
      }
      if (apiErr.status === 402 || apiErr.code === 'insufficient_balance') {
        throw new Error('你的 DeepSeek API 账户余额不足');
      }
      if (apiErr.status === 429 || apiErr.code === 'rate_limit') {
        throw new Error('API 调用频率过高，请稍后再试');
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error('网络连接失败，请检查网络');
      }
    }

    throw new Error(`AI 服务异常：${err instanceof Error ? err.message : '未知错误'}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---- 生成会话标题 ----
export async function generateSessionTitle(
  apiKey: string,
  model: ModelName,
  firstMessage: string,
): Promise<string> {
  const openai = getClient(apiKey);

  try {
    const resp = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: '用不超过10个字概括这段话的核心话题。只输出标题本身，不加任何标点或引号。' },
        { role: 'user', content: firstMessage.slice(0, 200) },
      ],
      temperature: 0.3,
      max_tokens: 30,
    });

    return resp.choices[0]?.message?.content?.trim() || '新对话';
  } catch {
    // 生成标题失败不阻塞主流程
    return firstMessage.slice(0, 10) + (firstMessage.length > 10 ? '…' : '');
  }
}
