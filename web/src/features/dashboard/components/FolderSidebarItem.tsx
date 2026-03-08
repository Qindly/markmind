// FolderSidebarItem.tsx - 渲染左侧目录栏中的单个文件夹条目
import { cn } from '../../../lib/cn';
import type { FolderItem } from '../../../types/dashboard';
import { DashboardInlineNameEditor } from './DashboardInlineNameEditor';
import { DashboardItemMenu } from './DashboardItemMenu';

export interface FolderSidebarItemProps {
  folder: FolderItem;
  isSelected: boolean;
  isEditing: boolean;
  isMenuOpen: boolean;
  editingValue: string;
  isSaving: boolean;
  onSelect: () => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onEditValueChange: (value: string) => void;
  onSubmitEdit: () => Promise<void>;
  onCancelEdit: () => void;
}

/**
 * FolderSidebarItem - 展示单个文件夹的选中、菜单与行内编辑状态。
 * 参数 props: 文件夹数据与交互回调。
 * 返回值：文件夹列表项 JSX。
 */
export function FolderSidebarItem({
  folder,
  isSelected,
  isEditing,
  isMenuOpen,
  editingValue,
  isSaving,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onStartEdit,
  onDelete,
  onEditValueChange,
  onSubmitEdit,
  onCancelEdit,
}: FolderSidebarItemProps) {
  if (isEditing) {
    return (
      <DashboardInlineNameEditor
        isSubmitting={isSaving}
        onCancel={onCancelEdit}
        onChange={onEditValueChange}
        onSubmit={onSubmitEdit}
        placeholder="请输入文件夹名称"
        value={editingValue}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-2xl border px-4 py-2 transition',
        isSelected
          ? 'border-[var(--color-option-selected)] bg-[var(--color-option-selected)] text-[var(--color-option-selected-text)]'
          : 'border-[var(--color-border-soft)] bg-[var(--color-page-bg)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-button-light-hover)]',
      )}
    >
      <button className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left" onClick={onSelect} type="button">
        <span className="truncate font-medium">{folder.name}</span>
        <span className={cn('text-xs', isSelected ? 'text-[var(--color-option-selected-muted)]' : 'text-[var(--color-text-muted)]')}>
          文件夹
        </span>
      </button>
      <DashboardItemMenu
        isOpen={isMenuOpen}
        isSelected={isSelected}
        onClose={onCloseMenu}
        onDelete={onDelete}
        onEdit={onStartEdit}
        onToggle={onToggleMenu}
      />
    </div>
  );
}