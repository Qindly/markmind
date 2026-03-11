// DocumentSearchScopeToggle.tsx - 提供 Dashboard 文档搜索范围切换按钮组
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';
import type { SearchScope } from '../../../types/dashboard';

const DOCUMENT_SEARCH_SCOPE_OPTIONS: Array<{ label: string; value: SearchScope }> = [
  { label: '当前目录', value: 'current_folder' },
  { label: '全部文档', value: 'global' },
];

export interface DocumentSearchScopeToggleProps {
  searchScope: SearchScope;
  onChangeSearchScope: (searchScope: SearchScope) => void;
}

/**
 * DocumentSearchScopeToggle - 切换 Dashboard 文档搜索范围。
 * 参数 props: 当前搜索范围与切换回调。
 * 返回值：搜索范围按钮组 JSX。
 */
export function DocumentSearchScopeToggle({ searchScope, onChangeSearchScope }: DocumentSearchScopeToggleProps) {
  return (
    <div
      aria-label="文档搜索范围"
      className="inline-flex w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-button-light)] p-1 sm:w-auto"
      role="group"
    >
      {DOCUMENT_SEARCH_SCOPE_OPTIONS.map((option) => {
        const isActive = option.value === searchScope;

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
            onClick={() => onChangeSearchScope(option.value)}
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
