// DashboardMoveDocumentDialog.tsx - 渲染首页文档移动归类弹层
import { useEffect, useMemo, useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/AlertDialog';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';
import type { FolderItem } from '../../../types/dashboard';

export interface DashboardMoveDocumentTarget {
  id: number;
  title: string;
  folderId: number | null;
}

export interface DashboardMoveDocumentDialogProps {
  target: DashboardMoveDocumentTarget | null;
  folders: FolderItem[];
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (folderId: number | null) => Promise<void>;
}

function getCurrentFolderLabel(folders: FolderItem[], folderId: number | null): string {
  if (folderId === null) {
    return '根目录';
  }

  return folders.find((folder) => folder.id === folderId)?.name ?? '未知目录';
}

/**
 * DashboardMoveDocumentDialog - 提供文档移动到文件夹或根目录的交互弹层。
 * 参数 props: 当前待移动文档、文件夹列表、提交状态与交互回调。
 * 返回值：移动归类弹层 JSX。
 */
export function DashboardMoveDocumentDialog({
  target,
  folders,
  isSubmitting,
  onCancel,
  onConfirm,
}: DashboardMoveDocumentDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const currentFolderLabel = useMemo(() => getCurrentFolderLabel(folders, target?.folderId ?? null), [folders, target?.folderId]);
  const hasAvailableTarget = target ? target.folderId !== null || folders.length > 0 : false;
  const canSubmit = target !== null && selectedFolderId !== target.folderId;

  useEffect(() => {
    setSelectedFolderId(target?.folderId ?? null);
  }, [target?.folderId, target?.id]);

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          onCancel();
        }
      }}
      open={Boolean(target)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">移动文档</p>
          <AlertDialogTitle>将“{target?.title ?? ''}”移动到其它目录</AlertDialogTitle>
          <AlertDialogDescription>
            当前所在目录：{currentFolderLabel}。请选择目标目录；根目录会固定显示在第一项。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
          <button
            className={cn(
              'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-[rgba(20,20,19,0.05)]',
              selectedFolderId === null
                ? 'border-[var(--color-option-selected)] bg-[var(--color-option-selected)] text-[var(--color-option-selected-text)]'
                : 'border-[var(--color-border-soft)] bg-[var(--color-page-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-button-light-hover)]',
            )}
            disabled={isSubmitting || target?.folderId === null}
            onClick={() => setSelectedFolderId(null)}
            type="button"
          >
            <span className="font-medium">根目录</span>
            <span className={cn('text-xs', selectedFolderId === null ? 'text-[var(--color-option-selected-muted)]' : 'text-[var(--color-text-muted)]')}>ROOT</span>
          </button>

          {folders.map((folder) => (
            <button
              className={cn(
                'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-[rgba(20,20,19,0.05)]',
                selectedFolderId === folder.id
                  ? 'border-[var(--color-option-selected)] bg-[var(--color-option-selected)] text-[var(--color-option-selected-text)]'
                  : 'border-[var(--color-border-soft)] bg-[var(--color-page-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-button-light-hover)]',
              )}
              disabled={isSubmitting || target?.folderId === folder.id}
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              type="button"
            >
              <span className="truncate font-medium">{folder.name}</span>
              <span className={cn('shrink-0 text-xs', selectedFolderId === folder.id ? 'text-[var(--color-option-selected-muted)]' : 'text-[var(--color-text-muted)]')}>
                文件夹
              </span>
            </button>
          ))}

          {!hasAvailableTarget ? (
            <p className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              当前没有可移动的其它目录。
            </p>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button className="h-10 w-auto px-4" disabled={isSubmitting} type="button" variant="secondary">
              取消
            </Button>
          </AlertDialogCancel>
          <Button className="h-10 w-auto px-4" disabled={!canSubmit} isLoading={isSubmitting} onClick={() => void onConfirm(selectedFolderId)} type="button">
            确认移动
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
