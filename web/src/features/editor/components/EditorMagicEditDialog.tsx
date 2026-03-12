// EditorMagicEditDialog.tsx - 渲染编辑器魔法笔局部改写对话框
import { Alert, AlertDescription } from '../../../components/ui/Alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/AlertDialog';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { Textarea } from '../../../components/ui/Textarea';

export interface EditorMagicEditDialogProps {
  open: boolean;
  selectedText: string;
  instruction: string;
  result: string;
  errorMessage: string;
  isSubmitting: boolean;
  onInstructionChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => Promise<void>;
  onApplyReplace: () => Promise<void>;
  onApplyInsert: () => Promise<void>;
  onCopy: () => Promise<void>;
}

/**
 * EditorMagicEditDialog - 展示魔法笔局部改写流程的对话框。
 * 参数 props: 选区内容、指令输入、AI 结果与动作回调。
 * 返回值：魔法笔对话框 JSX 结构。
 */
export function EditorMagicEditDialog({
  open,
  selectedText,
  instruction,
  result,
  errorMessage,
  isSubmitting,
  onInstructionChange,
  onOpenChange,
  onSubmit,
  onApplyReplace,
  onApplyInsert,
  onCopy,
}: EditorMagicEditDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>魔法笔</AlertDialogTitle>
          <AlertDialogDescription>为当前选中文段输入一条自定义指令，AI 会返回可直接写回文档的结果。</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <FormField label="当前选中文段">
            <div className="max-h-48 overflow-y-auto rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-3 text-sm leading-7 text-[var(--color-text-primary)]">
              <pre className="whitespace-pre-wrap break-words font-sans">{selectedText}</pre>
            </div>
          </FormField>

          <FormField label="自定义指令" message="例如：帮我润色成更专业的表达、保留列表结构并压缩为 3 点总结。">
            <Textarea
              className="min-h-[140px]"
              onChange={(event) => onInstructionChange(event.target.value)}
              placeholder="请输入希望 AI 如何处理这段内容..."
              value={instruction}
            />
          </FormField>

          <FormField label="AI 返回结果" message="魔法笔会尽量保留 Markdown 语义，返回的内容可以直接替换或插入。">
            <div className="min-h-[160px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-3 text-sm leading-7 text-[var(--color-text-primary)]">
              {result ? <pre className="whitespace-pre-wrap break-words font-sans">{result}</pre> : <p className="text-[var(--color-text-secondary)]">提交后会在这里展示 AI 结果。</p>}
            </div>
          </FormField>
        </div>

        <AlertDialogFooter className="flex-wrap gap-2">
          <Button onClick={() => onOpenChange(false)} type="button" variant="secondary">
            取消
          </Button>
          {result ? (
            <>
              <Button onClick={() => void onCopy()} type="button" variant="secondary">
                复制
              </Button>
              <Button onClick={() => void onApplyInsert()} type="button" variant="secondary">
                插入
              </Button>
              <Button onClick={() => void onApplyReplace()} type="button">
                替换
              </Button>
            </>
          ) : (
            <Button isLoading={isSubmitting} onClick={() => void onSubmit()} type="button">
              开始处理
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
