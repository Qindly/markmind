// EditorTranslateDialog.tsx - 渲染编辑器局部翻译对话框
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
import { Input } from '../../../components/ui/Input';
import type { AIRequestStatus } from '../../../types/ai';
import { translationLanguageSuggestions } from '../translationLanguageSuggestions';

export interface EditorTranslateDialogProps {
  open: boolean;
  selectedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  result: string;
  errorMessage: string;
  status: AIRequestStatus;
  onChangeSourceLanguage: (value: string) => void;
  onChangeTargetLanguage: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => Promise<void>;
  onAbort: () => void;
  onApplyReplace: () => Promise<void>;
  onApplyInsert: () => Promise<void>;
  onCopy: () => Promise<void>;
}

/**
 * EditorTranslateDialog - 展示局部翻译流程的对话框。
 * 参数 props: 选区内容、语言配置、翻译结果与动作回调。
 * 返回值：翻译对话框 JSX 结构。
 */
export function EditorTranslateDialog({
  open,
  selectedText,
  sourceLanguage,
  targetLanguage,
  result,
  errorMessage,
  status,
  onChangeSourceLanguage,
  onChangeTargetLanguage,
  onOpenChange,
  onSubmit,
  onAbort,
  onApplyReplace,
  onApplyInsert,
  onCopy,
}: EditorTranslateDialogProps) {
  const isStreaming = status === 'streaming';
  const hasCompleted = status === 'completed';
  const resultMessage =
    status === 'streaming'
      ? `正在实时翻译为 ${targetLanguage || '目标语言'}，可以随时中断。`
      : status === 'aborted'
        ? '本次翻译已中断，下方内容仅为未完成译文，如需写回文档请重新翻译。'
        : hasCompleted
          ? `译文已生成完成，可直接复制、插入或替换为 ${targetLanguage || '目标语言'} 版本。`
          : '提交后会展示可直接写回文档的译文。';
  const submitButtonLabel = status === 'aborted' || result ? '重新翻译' : '开始翻译';

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>中英翻译</AlertDialogTitle>
          <AlertDialogDescription>支持原语言自动检测，结果会生成保留 Markdown 结构的目标语言译文。</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <FormField label="当前选中文段">
            <div className="max-h-40 overflow-y-auto rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-3 text-sm leading-7 text-[var(--color-text-primary)]">
              <pre className="whitespace-pre-wrap break-words font-sans">{selectedText}</pre>
            </div>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField htmlFor="translate-source-language" label="原语言" message="填写 auto 表示自动检测，也可以直接输入语言名称。">
              <Input
                disabled={isStreaming}
                id="translate-source-language"
                list="translation-language-suggestions"
                onChange={(event) => onChangeSourceLanguage(event.target.value)}
                placeholder="auto"
                value={sourceLanguage}
              />
            </FormField>
            <FormField htmlFor="translate-target-language" label="目标语言" message="默认为中文，也可以输入英文、日文等其它语言名称。">
              <Input
                disabled={isStreaming}
                id="translate-target-language"
                list="translation-language-suggestions"
                onChange={(event) => onChangeTargetLanguage(event.target.value)}
                placeholder="中文"
                value={targetLanguage}
              />
            </FormField>
          </div>

          <datalist id="translation-language-suggestions">
            {translationLanguageSuggestions.map((language) => (
              <option key={language} value={language} />
            ))}
          </datalist>

          <FormField label="译文结果" message={resultMessage}>
            <div className="min-h-[200px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-3 text-sm leading-7 text-[var(--color-text-primary)]">
              {result ? (
                <pre className="whitespace-pre-wrap break-words font-sans">{result}</pre>
              ) : (
                <p className="text-[var(--color-text-secondary)]">AI 翻译完成后，会在这里展示目标语言译文。</p>
              )}
            </div>
          </FormField>
        </div>

        <AlertDialogFooter className="flex-wrap gap-2">
          <Button onClick={() => onOpenChange(false)} type="button" variant="secondary">
            取消
          </Button>
          {isStreaming ? (
            <Button onClick={onAbort} type="button" variant="secondary">
              中断生成
            </Button>
          ) : hasCompleted ? (
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
            <Button onClick={() => void onSubmit()} type="button">
              {submitButtonLabel}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
