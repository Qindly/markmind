// DocumentSearchMatchTags.tsx - 渲染 Dashboard 搜索结果命中来源标签
import { cn } from '../../../lib/cn';
import type { SearchMatchSource } from '../../../types/dashboard';

export interface DocumentSearchMatchTagsProps {
  matchSources: SearchMatchSource[];
  isSelected: boolean;
}

const SEARCH_MATCH_SOURCE_LABELS: Record<SearchMatchSource, string> = {
  title: '标题命中',
  content: '正文命中',
};

/**
 * DocumentSearchMatchTags - 展示文档搜索结果的命中来源标签。
 * 参数 props: 命中来源列表与当前是否选中。
 * 返回值：标签组 JSX；没有命中来源时返回 null。
 */
export function DocumentSearchMatchTags({ matchSources, isSelected }: DocumentSearchMatchTagsProps) {
  if (matchSources.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {matchSources.map((matchSource) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none',
            isSelected
              ? 'border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.12)] text-[var(--color-option-selected-muted)]'
              : 'border-[var(--color-border-soft)] bg-[rgba(20,20,19,0.03)] text-[var(--color-text-secondary)]',
          )}
          key={matchSource}
        >
          {SEARCH_MATCH_SOURCE_LABELS[matchSource]}
        </span>
      ))}
    </div>
  );
}
