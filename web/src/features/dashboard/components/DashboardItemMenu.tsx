// DashboardItemMenu.tsx - 提供首页列表项右侧的三点操作菜单
import { useEffect, useRef, type MouseEvent } from 'react';

import { cn } from '../../../lib/cn';

export interface DashboardItemMenuProps {
  isOpen: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * DashboardItemMenu - 渲染列表项三点菜单与下拉操作。
 * 参数 props: 菜单开关状态、选中态与修改/删除回调。
 * 返回值：菜单按钮与下拉面板 JSX。
 */
export function DashboardItemMenu({ isOpen, isSelected, onToggle, onClose, onEdit, onDelete }: DashboardItemMenuProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: globalThis.MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, onClose]);

  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onToggle();
  }

  function handleEdit(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onEdit();
  }

  function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onDelete();
  }

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-xl border text-lg leading-none transition',
          isSelected
            ? 'border-transparent bg-transparent text-[var(--color-option-selected-muted)] hover:bg-[rgba(255,255,255,0.08)]'
            : 'border-transparent bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border-soft)] hover:bg-[var(--color-button-light-hover)] hover:text-[var(--color-text-primary)]',
        )}
        onClick={handleToggle}
        type="button"
      >
        ⋮
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-28 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-1 shadow-soft">
          <button
            className="flex h-10 w-full items-center rounded-xl px-3 text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-button-light-hover)]"
            onClick={handleEdit}
            type="button"
          >
            修改
          </button>
          <button
            className="flex h-10 w-full items-center rounded-xl px-3 text-sm text-[var(--color-toast-danger-text)] transition hover:bg-[var(--color-button-light-hover)]"
            onClick={handleDelete}
            type="button"
          >
            删除
          </button>
        </div>
      ) : null}
    </div>
  );
}