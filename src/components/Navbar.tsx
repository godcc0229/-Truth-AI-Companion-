// ============================================================
// Navbar — 底部三栏导航（树洞 / 深度对话 / 设置）
// ============================================================

import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  {
    path: '/treehole',
    label: '树洞',
    emoji: '🌳',
    description: '即时倾诉',
  },
  {
    path: '/deepchat',
    label: '深度',
    emoji: '💬',
    description: '连续对话',
  },
  {
    path: '/settings',
    label: '设置',
    emoji: '⚙️',
    description: 'API Key',
  },
] as const;

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/treehole') return location.pathname === '/' || location.pathname.startsWith('/treehole');
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 z-40 safe-area-bottom">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-full px-4 transition-all ${
                active
                  ? 'text-indigo-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className={`text-[11px] font-medium ${active ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
