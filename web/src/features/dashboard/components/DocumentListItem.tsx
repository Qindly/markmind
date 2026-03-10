// DocumentListItem.tsx - 渲染右侧文档列表中的单个文档条目
import { renderSearchHighlightedText } from '../documentSearchHighlight';

import { cn } from '../../../lib/cn';
import type { DashboardDocumentListItem } from '../../../types/dashboard';
import { DashboardInlineNameEditor } from './DashboardInlineNameEditor';
import { DashboardListItem } from './DashboardListItem';
import { DashboardItemMenu } from './DashboardItemMenu';

export interface DocumentListItemProps {
  document: DashboardDocumentListItem;
  isSelected: boolean;
  isEditing: boolean;
  isMenuOpen: boolean;
  editingValue: string;
  isSaving: boolean;
  searchKeyword: string;
  onSelect: () => void;
  onMenuOpenChange: (open: boolean) => void;
  onMove: () => void;
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

function getSearchSnippet(document: DashboardDocumentListItem): string {
  return 'snippet' in document ? document.snippet : '';
}

/**
 * DocumentListItem - 展示单个文档的选中、搜索摘要、菜单与行内编辑状态。
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
  searchKeyword,
  onSelect,
  onMenuOpenChange,
  onMove,
  onStartEdit,
  onDelete,
  onEditValueChange,
  onSubmitEdit,
  onCancelEdit,
}: DocumentListItemProps) {
  const normalizedKeyword = searchKeyword.trim();
  const snippet = getSearchSnippet(document);
  const shouldShowSnippet = normalizedKeyword !== '' && snippet !== '';
  const matchedClassName = isSelected
    ? 'rounded bg-[rgba(255,255,255,0.18)] px-1 text-inherit'
    : 'rounded bg-[rgba(20,20,19,0.08)] px-1 text-inherit';

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
          onMove={onMove}
          onOpenChange={onMenuOpenChange}
        />
      }
      actionClassName="pr-3 pt-4"
      buttonClassName="h-full px-5 py-4"
      className={shouldShowSnippet ? 'min-h-[132px]' : 'min-h-[96px]'}
      contentClassName="h-full items-start"
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-4">
          <span className="line-clamp-2 text-base font-medium leading-6">
            {renderSearchHighlightedText(document.title, normalizedKeyword, matchedClassName)}
          </span>
          <span className={cn('text-xs', isSelected ? 'text-[var(--color-option-selected-muted)]' : 'text-[var(--color-text-muted)]')}>
            #{document.id}
          </span>
        </div>

        {shouldShowSnippet ? (
          <p
            className={cn(
              'line-clamp-2 text-sm leading-6',
              isSelected ? 'text-[var(--color-option-selected-muted)]' : 'text-[var(--color-text-secondary)]',
            )}
          >
            {renderSearchHighlightedText(snippet, normalizedKeyword, matchedClassName)}
          </p>
        ) : null}

        <p className={cn('text-sm', isSelected ? 'text-[var(--color-option-selected-muted)]' : 'text-[var(--color-text-muted)]')}>
          更新时间：{formatUpdatedAt(document.updated_at)}
        </p>
      </div>
    </DashboardListItem>
  );
}
