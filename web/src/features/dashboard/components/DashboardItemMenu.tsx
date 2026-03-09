// DashboardItemMenu.tsx - 提供首页列表项右侧的三点操作菜单
import type { MouseEvent } from 'react';

import { MoreVertical } from 'lucide-react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/DropdownMenu';
import { cn } from '../../../lib/cn';

export interface DashboardItemMenuProps {
  isOpen: boolean;
  isSelected: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * DashboardItemMenu - 渲染列表项三点菜单与下拉操作。
 * 参数 props: 菜单开关状态、选中态与修改/删除回调。
 * 返回值：菜单按钮与下拉面板 JSX。
 */
export function DashboardItemMenu({ isOpen, isSelected, onOpenChange, onEdit, onDelete }: DashboardItemMenuProps) {
  function handleTriggerClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  function handleEdit() {
    onEdit();
  }

  function handleDelete() {
    onDelete();
  }

  return (
    <DropdownMenu
      modal={false}
      onOpenChange={onOpenChange}
      open={isOpen}
    >
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-lg leading-none transition outline-none focus-visible:ring-2 focus-visible:ring-[rgba(20,20,19,0.05)]',
            isSelected
              ? 'border-transparent bg-transparent text-[var(--color-option-selected-muted)] hover:bg-[rgba(255,255,255,0.08)]'
              : 'border-transparent bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border-soft)] hover:bg-[var(--color-button-light-hover)] hover:text-[var(--color-text-primary)]',
          )}
          onClick={handleTriggerClick}
          type="button"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-28">
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            handleEdit();
          }}
        >
          修改
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-[var(--color-toast-danger-text)]"
          onSelect={(event) => {
            event.preventDefault();
            handleDelete();
          }}
        >
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
