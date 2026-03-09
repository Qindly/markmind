// DocumentListItem.tsx - 渲染右侧文档列表中的单个文档条目
import { cn } from '../../../lib/cn';
import type { DocumentItem } from '../../../types/dashboard';
import { DashboardInlineNameEditor } from './DashboardInlineNameEditor';
import { DashboardListItem } from './DashboardListItem';
import { DashboardItemMenu } from './DashboardItemMenu';

export interface DocumentListItemProps {
  document: DocumentItem;
  isSelected: boolean;
  isEditing: boolean;
  isMenuOpen: boolean;
  editingValue: string;
  isSaving: boolean;
  onSelect: () => void;
  onMenuOpenChange: (open: boolean) => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onEditValueChange: (value: string) => void;
  onSubmitEdit: () => Promise<void>;
  onCancelEdit: () => void;
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '更新时间未知';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * DocumentListItem - 展示单个文档的选中、菜单与行内编辑状态。
 * 参数 props: 文档数据与交互回调。
 * 返回值：文档列表项 JSX。
 */
export function DocumentListItem({
  document,
  isSelected,
  isEditing,
  isMenuOpen,
  editingValue,
  isSaving,
  onSelect,
  onMenuOpenChange,
  onStartEdit,
  onDelete,
  onEditValueChange,
  onSubmitEdit,
  onCancelEdit,
}: DocumentListItemProps) {
  if (isEditing) {
    return (
      <DashboardInlineNameEditor
        isSubmitting={isSaving}
        onCancel={onCancelEdit}
        onChange={onEditValueChange}
        onSubmit={onSubmitEdit}
        placeholder="请输入文档标题"
        value={editingValue}
      />
    );
  }

  return (
    <DashboardListItem
      action={
        <DashboardItemMenu
          isOpen={isMenuOpen}
          isSelected={isSelected}
          onDelete={onDelete}
          onEdit={onStartEdit}
          onOpenChange={onMenuOpenChange}
        />
      }
      actionClassName="pr-3 pt-4"
      buttonClassName="px-5 py-4"
      contentClassName="items-start"
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <span className="truncate text-base font-medium">{document.title}</span>
            <span className={cn('text-xs', isSelected ? 'text-[var(--color-option-selected-muted)]' : 'text-[var(--color-text-muted)]')}>
              #{document.id}
            </span>
          </div>
          <p className={cn('text-sm', isSelected ? 'text-[var(--color-option-selected-muted)]' : 'text-[var(--color-text-muted)]')}>
            更新时间：{formatUpdatedAt(document.updated_at)}
          </p>
      </div>
    </DashboardListItem>
  );
}
