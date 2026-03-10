// DocumentSearchEmptyState.tsx - 渲染文档搜索无结果时的空状态
import type { SearchScope } from '../../../types/dashboard';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getSearchScopeLabel } from '../documentListPanelLayout';

export interface DocumentSearchEmptyStateProps {
  searchScope: SearchScope;
  searchKeyword: string;
  onClearSearch: () => void;
}

/**
 * DocumentSearchEmptyState - 展示搜索无结果时的提示与清空入口。
 * 参数 props: 当前范围、关键字与清空回调。
 * 返回值：搜索空状态 JSX。
 */
export function DocumentSearchEmptyState({
  searchScope,
  searchKeyword,
  onClearSearch,
}: DocumentSearchEmptyStateProps) {
  const searchScopeLabel = getSearchScopeLabel(searchScope);

  return (
    <EmptyState
      action={
        <Button className="w-auto px-4" onClick={onClearSearch} type="button" variant="secondary">
          清空搜索
        </Button>
      }
      description={`${searchScopeLabel}中没有标题或正文包含“${searchKeyword.trim()}”的文档，试试更换关键字或切换搜索范围。`}
      title="没有匹配结果"
    />
  );
}
