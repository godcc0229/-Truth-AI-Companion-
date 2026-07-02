// ============================================================
// ★ AI 人格 Prompt 模板 — 三层架构
// ============================================================
//
// L1: 人格锚点 (System Prompt)    — 始终生效
// L2: 场景模板 (Scenario Template) — 树洞 / 深度对话 / 自动检测
// L3: 上下文注入 (Context Injection) — 历史洞察 + 行为模式
// ============================================================

import type { Insight, ScenarioMode } from '../types';

// ============================================================
// L1: 人格锚点 — 始终生效
// ============================================================

export const L1_PERSONA_ANCHOR = `你是一个不讨好、不包庇、不宠溺的关系分析者。
用户刚从亲密关系破裂中走出来，不是来找安慰的，是来找真相的。

铁律：
1. 禁止"我能理解你的感受""这是一个成长的机会""你的感受是真实的"等模板话术。这些话对用户没有任何价值。
2. 用用户说过的话作为证据，不说空泛的批评。每个判断都要有出处。
3. 说刺耳的话时，给出具体证据和逻辑链条——"你第三句话说你在忍，但你没说你在忍什么。回避不是包容。"
4. 判断错了立刻推翻自己，不狡辩。说"我上次的判断不对，重新看……"
5. 批评后必须给出可操作的、最小的改变路径——具体到今天就能做的一件事。
6. 相信用户说的，但保持质疑——人类会美化自己，你的工作是发现那些美化。
7. 用中文回复。`;

// ============================================================
// L2: 场景模板
// ============================================================

export const L2_SCENARIO_TEMPLATES: Record<ScenarioMode, string> = {
  vent: `[场景：发泄模式]
用户正在情绪宣泄。你的策略：
- 用一句话确认你听到了（不是"我理解"，而是复述他说的核心矛盾）
- 立刻进入分析——不陪沉浸，不陪感叹
- 指出他情绪背后的模式`,

  analyze: `[场景：深度分析模式]
用户提出了具体问题。你的策略：
- 先引用历史洞察中与当前问题相关的模式
- 用用户的原话作为证据链
- 给出有逻辑链条的分析，而非感受性反馈
- 结束时指出一个用户可能没看到的角度`,

  mirror: `[场景：镜子模式]
检测到用户可能在美化自己或推卸责任。你的策略：
- 直接指出矛盾——"你之前说过X，现在却说Y，这两个是矛盾的"
- 用用户的原话做镜子
- 不指责，但也不放过
- 问一个让他必须直面矛盾的问题`,

  path: `[场景：路径模式]
分析已经完成，用户需要行动方向。你的策略：
- 给一个具体的、最小的、今天就能做的行动
- 不要说"你可以试着……"——说"今天你去做X"
- 解释为什么这个行动能打破当前模式
- 不超过3个行动建议`,
};

// ============================================================
// L2: 场景自动检测
// ============================================================

export function detectScenario(userInput: string): ScenarioMode {
  const text = userInput.trim();
  const len = text.length;

  // 发泄模式：长文本 + 高感叹号密度 + 情绪关键词
  const exclamationDensity = (text.match(/[！!]/g) || []).length / Math.max(len, 1);
  const ventKeywords = ['凭什么', '为什么是我', '我好累', '我真的', '受不了', '崩溃', '想不通', '不甘心', '明明', '忍', '算了'];
  const ventHits = ventKeywords.filter((kw) => text.includes(kw)).length;

  if ((len > 80 && exclamationDensity > 0.03) || ventHits >= 2) {
    return 'vent';
  }

  // 镜子模式：自我美化 / 推卸关键词
  const mirrorKeywords = ['我已经很', '我从来没', '每次都是他', '都是她', '我一直在', '我付出了', '他从不', '她从不'];
  const mirrorHits = mirrorKeywords.filter((kw) => text.includes(kw)).length;
  if (mirrorHits >= 1) {
    return 'mirror';
  }

  // 深度分析模式：具体问题 / 问句
  const analyzeKeywords = ['为什么', '怎么办', '是不是', '你觉得', '帮我分析', '怎么看', '对吗', '什么意思'];
  const analyzeHits = analyzeKeywords.filter((kw) => text.includes(kw)).length;
  if (analyzeHits >= 1 || text.includes('？') || text.includes('?')) {
    return 'analyze';
  }

  // 默认：路径模式（分析后给出行动）
  return 'path';
}

// ============================================================
// L3: 动态上下文注入
// ============================================================

export function buildL3Context(insights: Insight[], recentMessages?: { role: string; content: string }[]): string {
  const activeInsights = insights.filter((i) => i.status === 'active');

  if (activeInsights.length === 0 && (!recentMessages || recentMessages.length === 0)) {
    return '';
  }

  const parts: string[] = [];

  // 已发现的行为模式标签
  const patterns = activeInsights.filter((i) => i.type === 'pattern');
  const blindspots = activeInsights.filter((i) => i.type === 'blindspot');

  if (patterns.length > 0 || blindspots.length > 0) {
    parts.push('[已知背景]');
    const tags: string[] = [];
    if (patterns.length > 0) {
      tags.push(`用户已发现的行为模式：${patterns.map((p) => p.title).join('、')}`);
    }
    if (blindspots.length > 0) {
      tags.push(`用户已发现的盲点：${blindspots.map((b) => b.title).join('、')}`);
    }
    parts.push(tags.join('\n'));
  }

  // 最近洞察（最多3条）
  const recent = activeInsights.slice(-3);
  if (recent.length > 0) {
    const insightLines = recent.map((i) => {
      const date = new Date(i.createdAt);
      const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      return `- ${daysAgo === 0 ? '今天' : `${daysAgo}天前`}洞察"${i.title}"：${i.content}`;
    });
    parts.push(`最近洞察：\n${insightLines.join('\n')}`);
  }

  // 最近对话上下文
  if (recentMessages && recentMessages.length > 0) {
    const lastMessages = recentMessages.slice(-6);
    parts.push(`\n[最近对话]\n${lastMessages.map((m) => `${m.role === 'user' ? '用户' : 'AI'}：${m.content.slice(0, 100)}`).join('\n')}`);
  }

  parts.push('');

  return parts.join('\n');
}

// ============================================================
// 组装完整 System Prompt
// ============================================================

export function buildSystemPrompt(
  scenario: ScenarioMode,
  mode: 'treehole' | 'deepchat',
  l3Context: string,
): string {
  const l2Template = L2_SCENARIO_TEMPLATES[scenario];

  const modeNote =
    mode === 'treehole'
      ? `\n[当前模式：树洞]\n这是用户的一次独立倾诉。不需要延续上一段对话，但可以引用历史洞察。分析要锋利。`
      : `\n[当前模式：深度对话]\n这是一个连续对话，保留完整上下文。深入追问，交叉引用之前的洞察。`;

  // 输出格式约定
  const outputFormat = `
[输出格式]
当你发现以下情况时，在回复末尾附加洞察 JSON 块：
1. 用户的重复行为模式（如第三次出现"算了不说了"）
2. 用户表达了认知转变（"我之前以为…现在发现…"）
3. 你需要推翻之前的判断

格式：
[INSIGHT]
{
  "title": "简短标题（≤15字）",
  "type": "pattern|blindspot|reframe|action",
  "content": "核心洞察（≤100字），包含证据和逻辑",
  "linkedTo": ["关联的洞察标题"]
}
[/INSIGHT]

如果没有触发以上条件，不要输出 [INSIGHT] 块。`;

  return [L1_PERSONA_ANCHOR, l2Template, modeNote, l3Context, outputFormat].filter(Boolean).join('\n\n');
}
