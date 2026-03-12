// EditorSelectionActions.tsx - 渲染编辑器选区出现后的悬浮 AI 快捷入口
import { Languages, Sparkles } from 'lucide-react';

import { Button } from '../../../components/ui/Button';

export interface EditorSelectionActionsProps {
  top: number;
  left: number;
  onOpenMagicEdit: () => void;
  onOpenTranslate: () => void;
}

/**
 * EditorSelectionActions - 渲染编辑器选区附近的 AI 悬浮快捷入口。
 * 参数 props: 浮层定位与两个 AI 快捷操作回调。
 * 返回值：固定定位的悬浮按钮组 JSX 结构。
 */
export function EditorSelectionActions({
  top,
  left,
  onOpenMagicEdit,
  onOpenTranslate,
}: EditorSelectionActionsProps) {
  return (
    <div className="fixed z-[130] flex flex-col gap-2 rounded-[28px] border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-2 shadow-soft" style={{ top, left }}>
      <Button
        aria-label="打开魔法笔"
        className="h-11 w-11 rounded-full"
        onClick={onOpenMagicEdit}
        size="icon"
        title="魔法笔"
        type="button"
        variant="secondary"
      >
        <Sparkles className="h-4 w-4" />
      </Button>
      <Button
        aria-label="打开翻译"
        className="h-11 w-11 rounded-full"
        onClick={onOpenTranslate}
        size="icon"
        title="中英翻译"
        type="button"
        variant="secondary"
      >
        <Languages className="h-4 w-4" />
      </Button>
    </div>
  );
}
