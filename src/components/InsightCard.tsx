// ============================================================
// InsightCard — 洞察卡片（编译结果展示）
// ============================================================

import type { Insight } from '../types';

interface InsightCardProps {
  insight: Insight;
  compact?: boolean;
  onArchive?: (id: string) => void;
  onClick?: (id: string) => void;
}

const TYPE_CONFIG: Record<Insight['type'], { emoji: string; label: string; color: string }> = {
  pattern: { emoji: '🔄', label: '行为模式', color: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
  blindspot: { emoji: '🪞', label: '认知盲点', color: 'bg-rose-500/10 border-rose-500/30 text-rose-300' },
  reframe: { emoji: '🔀', label: '认知重构', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
  action: { emoji: '🛤️', label: '行动路径', color: 'bg-sky-500/10 border-sky-500/30 text-sky-300' },
};

export default function InsightCard({ insight, compact = false, onArchive, onClick }: InsightCardProps) {
  const config = TYPE_CONFIG[insight.type];

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        compact ? 'text-sm' : ''
      } ${config.color} ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={() => onClick?.(insight.id)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{config.emoji}</span>
        <span className="text-xs font-medium uppercase tracking-wider opacity-70">{config.label}</span>
        <span className="text-[10px] opacity-50 ml-auto">
          {formatDate(insight.createdAt)}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-[15px] mb-1.5">{insight.title}</h4>

      {/* Content */}
      {!compact && (
        <p className="text-sm opacity-85 leading-relaxed mb-3">{insight.content}</p>
      )}

      {/* Source quote */}
      {!compact && insight.source.quote && (
        <blockquote className="border-l-2 border-current/30 pl-3 text-xs opacity-60 italic mb-2">
          "{insight.source.quote}"
        </blockquote>
      )}

      {/* Linked insights */}
      {!compact && insight.linkedTo.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {insight.linkedTo.map((id) => (
            <span key={id} className="text-[10px] px-2 py-0.5 rounded-full bg-current/10">
              🔗 关联洞察
            </span>
          ))}
        </div>
      )}

      {/* Archive button */}
      {!compact && onArchive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive(insight.id);
          }}
          className="mt-3 text-[11px] opacity-40 hover:opacity-80 transition-opacity"
        >
          归档此洞察
        </button>
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
