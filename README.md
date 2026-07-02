# 🪞 Truth AI Companion

**第一个敢对你说真话的 AI 关系分析师。**

不是安慰机器人——是从关系中看清自己的镜子。

[![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![DeepSeek](https://img.shields.io/badge/AI-DeepSeek-4F46E5)](https://platform.deepseek.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Why — 为什么做这个

我分手后用 Claude 做了一次深度对话，发现 AI 的**不讨好式分析**比朋友的建议更锋利。

朋友会说"你会找到更好的"——AI 会说"你第三句话说你在忍，但你没说你在忍什么。回避不是包容。"

所以我把这种体验产品化了：一个不会说"我理解你"、只会基于你说过的话给你证据和分析的 AI 伴侣。纯前端、隐私优先、用户自持 API Key。

## 3 个技术亮点

### 1. 三层 Prompt 人格系统
```
L1: 人格锚点 (System Prompt)      → 始终生效："不讨好、不包庇、不宠溺"
L2: 场景模板 (Scenario Template)  → 发泄 / 分析 / 镜子 / 路径，自动检测
L3: 上下文注入 (Context Injection) → 历史洞察 + 行为模式 + 最近对话
```

AI 不会对每个用户说一样的话——它会记住你之前说的，交叉引用，发现行为模式。

### 2. 人格 RAG — 自动知识编译
AI 在对话中自动发现重复模式、认知转变、判断修正时，输出结构化的 `[INSIGHT]` 块。前端解析后持久化为洞察卡片，并在后续对话中自动注入上下文。

```
用户原话 → 行为模式检测 → 洞察编译 → 持久化 → 未来对话自动引用
```

### 3. 隐私优先，纯前端
- 数据 100% 存储在浏览器 localStorage
- AI API 由用户自己的 DeepSeek API Key 直连
- 不经过任何后端服务器
- 无需注册、无需登录

## 本地运行

```bash
# 1. Clone
git clone https://github.com/weidejia/truth-ai-companion.git
cd truth-ai-companion

# 2. Install
npm install

# 3. Dev
npm run dev
```

打开 http://localhost:5173 ，首次访问会提示你输入 DeepSeek API Key。

> 没有 API Key？去 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 免费注册，新用户有赠送额度。

## 设计哲学

**被挑战 > 被理解 > 被引导 > 被沉淀**

| 普通 AI 聊天 | Truth AI Companion |
|:--|:--|
| "我理解你的感受..." | "你第三句话说你在忍，但你没说你在忍什么。回避不是包容。" |
| 每轮对话独立 | 记住所有对话，交叉引用，发现行为模式 |
| 舒适的 | 不舒服的——但有用 |

## 技术栈

- **框架**: React 18 + TypeScript
- **构建**: Vite 5
- **样式**: Tailwind CSS 4
- **路由**: React Router v6 (HashRouter)
- **AI**: DeepSeek API（OpenAI SDK 兼容）
- **存储**: localStorage
- **部署**: GitHub Pages

## 项目结构

```
src/
├── config/
│   └── personality.ts    # ★ AI 人格 Prompt 模板（三层架构）
├── services/
│   ├── ai.ts             # ★ AI API 调用 + Prompt 组装
│   └── compiler.ts       # ★ 洞察自动编译与持久化
├── pages/
│   ├── Treehole.tsx       # 树洞页（独立倾诉）
│   ├── DeepChat.tsx       # 深度对话页（连续会话）
│   └── SettingsPage.tsx   # 设置页
├── components/
│   ├── ChatBubble.tsx     # 消息气泡
│   ├── InsightCard.tsx    # 洞察卡片
│   ├── ApiKeyModal.tsx    # API Key 弹窗
│   ├── Navbar.tsx         # 底部导航
│   └── InputArea.tsx      # 输入框
├── hooks/
│   ├── useChat.ts         # 对话核心逻辑
│   └── useLocalStorage.ts # localStorage Hook
├── types/
│   └── index.ts
└── utils/
    └── storage.ts         # localStorage 封装 + 版本迁移
```

## License

MIT © 2024 韦德甲

---

<p align="center">🪞 不是安慰你的镜子——是让你看清自己的镜子。</p>
