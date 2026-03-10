// DocumentSearchEmptyState.tsx - 渲染文档搜索无结果时的空状态
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';

export interface DocumentSearchEmptyStateProps {
  searchKeyword: string;
  onClearSearch: () => void;
}

/**
 * DocumentSearchEmptyState - 展示当前目录搜索无结果时的提示与清空入口。
 * 参数 props: 当前关键字与清空回调。
 * 返回值：搜索空状态 JSX。
 */
export function DocumentSearchEmptyState({
  searchKeyword,
  onClearSearch,
}: DocumentSearchEmptyStateProps) {
  return (
    <EmptyState
      action={
        <Button className="w-auto px-4" onClick={onClearSearch} type="button" variant="secondary">
          清空搜索
        </Button>
      }
      description={`当前目录中没有标题包含“${searchKeyword.trim()}”的文档，试试更换关键字或直接查看全部文档。`}
      title="没有匹配结果"
    />
  );
}
