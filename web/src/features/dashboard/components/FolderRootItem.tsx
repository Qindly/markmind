// FolderRootItem.tsx - 渲染左侧目录栏中的根目录条目
import { cn } from '../../../lib/cn';
import { DashboardListItem } from './DashboardListItem';

export interface FolderRootItemProps {
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * FolderRootItem - 根目录列表项。
 * 参数 props: 选中状态与点击回调。
 * 返回值：根目录条目 JSX 结构。
 */
export function FolderRootItem({ isSelected, onSelect }: FolderRootItemProps) {
  return (
    <DashboardListItem
      buttonClassName="flex items-center justify-between gap-3 px-4 py-3 text-sm"
      className={!isSelected ? 'text-[var(--color-text-secondary)]' : undefined}
      contentClassName="items-center"
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <span className="font-medium">根目录</span>
      <span className={cn('text-xs', isSelected ? 'text-[var(--color-option-selected-muted)]' : 'text-[var(--color-text-muted)]')}>ROOT</span>
    </DashboardListItem>
  );
}
