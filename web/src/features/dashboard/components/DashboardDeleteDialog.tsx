// DashboardDeleteDialog.tsx - 渲染首页列表项删除前的二次确认弹层
import { useEffect } from 'react';

import { Button } from '../../../components/ui/Button';

interface DashboardDeleteTarget {
  type: 'folder' | 'document';
  id: number;
  name: string;
}

export interface DashboardDeleteDialogProps {
  target: DashboardDeleteTarget | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

/**
 * DashboardDeleteDialog - 删除文件夹或文档前的二次确认弹层。
 * 参数 props: 当前待删对象、提交状态与交互回调。
 * 返回值：确认弹层 JSX。
 */
export function DashboardDeleteDialog({ target, isSubmitting, onCancel, onConfirm }: DashboardDeleteDialogProps) {
  useEffect(() => {
    if (!target) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      onCancel();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [target, onCancel]);

  if (!target) {
    return null;
  }

  const entityLabel = target.type === 'folder' ? '文件夹' : '文档';
  const description =
    target.type === 'folder'
      ? '如果该文件夹下仍有文档，后端会阻止删除，请先清空文档后再操作。'
      : '删除后会立即从当前列表中移除，并通过红色提示告知你结果。';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--color-overlay)] p-4" onClick={onCancel} role="presentation">
      <div
        className="w-full max-w-md rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-6 shadow-soft"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">删除确认</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          确定删除{entityLabel}“{target.name}”吗？
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button className="h-10 w-auto px-4" onClick={onCancel} type="button" variant="secondary">
            取消
          </Button>
          <Button className="h-10 w-auto px-4" isLoading={isSubmitting} onClick={() => void onConfirm()} type="button" variant="danger">
            确认删除
          </Button>
        </div>
      </div>
    </div>
  );
}