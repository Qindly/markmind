// EditorLeaveConfirmDialog.tsx - 渲染编辑页返回首页前的二次确认弹层

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

export interface EditorLeaveConfirmDialogProps {
  open: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * EditorLeaveConfirmDialog - 编辑页离开前的二次确认弹层。
 * 参数 props: 当前打开状态、保存状态与取消/确认回调。
 * 返回值：确认返回首页弹层 JSX。
 */
export function EditorLeaveConfirmDialog({
  open,
  isSaving,
  onCancel,
  onConfirm,
}: EditorLeaveConfirmDialogProps) {
  const description = isSaving
    ? '当前文档仍在保存中，如果现在返回首页，你将看不到这次保存的最终结果提示。'
    : '当前文档还有未保存的更改，如果现在返回首页，未保存内容将不会自动保留。';

  return (
    <AlertDialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
      open={open}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">离开确认</p>
          <AlertDialogTitle>确定要返回首页吗？</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button className="h-10 w-auto px-4" type="button" variant="secondary">
              继续编辑
            </Button>
          </AlertDialogCancel>
          <Button className="h-10 w-auto px-4" onClick={onConfirm} type="button">
            确认返回
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
