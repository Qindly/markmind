// DocumentSortToggle.tsx - 提供 Dashboard 文档列表的排序切换按钮组
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';
import type { DocumentSortMode } from '../../../types/dashboard';

const DOCUMENT_SORT_OPTIONS: Array<{ label: string; value: DocumentSortMode }> = [
  { label: '最近更新', value: 'updated_desc' },
  { label: '标题', value: 'title_asc' },
];

export interface DocumentSortToggleProps {
  sortMode: DocumentSortMode;
  onChangeSortMode: (sortMode: DocumentSortMode) => void;
}

/**
 * DocumentSortToggle - 切换 Dashboard 文档列表排序模式。
 * 参数 props: 当前排序模式与切换回调。
 * 返回值：排序按钮组 JSX。
 */
export function DocumentSortToggle({ sortMode, onChangeSortMode }: DocumentSortToggleProps) {
  return (
    <div
      aria-label="文档排序方式"
      className="inline-flex w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-button-light)] p-1 sm:w-auto"
      role="group"
    >
      {DOCUMENT_SORT_OPTIONS.map((option) => {
        const isActive = option.value === sortMode;

        return (
          <Button
            aria-pressed={isActive}
            className={cn(
              'h-9 flex-1 border-transparent px-3 text-xs shadow-none sm:w-auto',
              isActive
                ? 'border-[var(--color-border-strong)] bg-[var(--color-page-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-page-bg)]'
                : 'bg-transparent text-[var(--color-text-secondary)] hover:border-transparent hover:bg-[var(--color-button-light-hover)]',
            )}
            key={option.value}
            onClick={() => onChangeSortMode(option.value)}
            size="sm"
            type="button"
            variant="secondary"
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
