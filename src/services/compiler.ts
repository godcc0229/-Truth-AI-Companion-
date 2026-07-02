// ============================================================
// ★ 洞察自动编译与持久化
// ============================================================

import type { Insight, ParsedAIResponse } from '../types';
import { getInsights, saveInsights } from '../utils/storage';

// Re-export for convenience
export { getInsights };

// ---- 生成唯一 ID ----
function generateId(): string {
  return `ins_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---- 去重检查 ----
function isDuplicate(newInsight: { title: string; content: string }, existing: Insight[]): boolean {
  return existing.some((i) => {
    // 标题完全匹配 或 内容相似度 > 80%
    if (i.title === newInsight.title) return true;
    const overlap = longestCommonSubstring(i.content, newInsight.content);
    const similarity = overlap / Math.max(i.content.length, newInsight.content.length, 1);
    return similarity > 0.8;
  });
}

function longestCommonSubstring(a: string, b: string): number {
  let maxLen = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      let k = 0;
      while (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) {
        k++;
      }
      if (k > maxLen) maxLen = k;
    }
  }
  return maxLen;
}

// ---- 解析交叉引用 ----
function resolveLinkedIds(linkedTitles: string[], allInsights: Insight[]): string[] {
  return linkedTitles
    .map((title) => {
      const found = allInsights.find((i) => i.title === title);
      return found?.id || null;
    })
    .filter((id): id is string => id !== null);
}

// ---- 编译入口 ----
export function compileInsight(
  parsed: ParsedAIResponse,
  conversationId: string,
): Insight | null {
  if (!parsed.insight) return null;

  const { insight } = parsed;
  const allInsights = getInsights();

  // 去重
  if (isDuplicate({ title: insight.title, content: insight.content }, allInsights)) {
    return null;
  }

  const linkedIds = resolveLinkedIds(insight.linkedTo, allInsights);

  const newInsight: Insight = {
    id: generateId(),
    title: insight.title,
    type: insight.type,
    source: {
      conversationId,
      quote: insight.source.quote || '',
    },
    content: insight.content,
    linkedTo: linkedIds,
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  // 持久化
  saveInsights([...allInsights, newInsight]);

  return newInsight;
}

// ---- 查询 ----
export function getRecentInsights(count = 3): Insight[] {
  return getInsights()
    .filter((i) => i.status === 'active')
    .slice(-count);
}

export function getInsightsByType(type: Insight['type']): Insight[] {
  return getInsights().filter((i) => i.type === type && i.status === 'active');
}

export function archiveInsight(id: string): void {
  const all = getInsights();
  const updated = all.map((i) => (i.id === id ? { ...i, status: 'archived' as const } : i));
  saveInsights(updated);
}
