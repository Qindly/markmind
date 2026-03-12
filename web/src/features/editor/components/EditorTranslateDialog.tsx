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
import type { TranslateResponseData } from '../../../types/ai';
import { translationLanguageSuggestions } from '../translationLanguageSuggestions';

export interface EditorTranslateDialogProps {
  open: boolean;
  selectedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  result: TranslateResponseData | null;
  errorMessage: string;
  isSubmitting: boolean;
  onChangeSourceLanguage: (value: string) => void;
  onChangeTargetLanguage: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => Promise<void>;
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
  isSubmitting,
  onChangeSourceLanguage,
  onChangeTargetLanguage,
  onOpenChange,
  onSubmit,
  onApplyReplace,
  onApplyInsert,
  onCopy,
}: EditorTranslateDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>中英翻译</AlertDialogTitle>
          <AlertDialogDescription>支持原语言自动检测，结果会生成可直接写回文档的双语对照 Markdown。</AlertDialogDescription>
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
                id="translate-source-language"
                list="translation-language-suggestions"
                onChange={(event) => onChangeSourceLanguage(event.target.value)}
                placeholder="auto"
                value={sourceLanguage}
              />
            </FormField>
            <FormField htmlFor="translate-target-language" label="目标语言" message="默认为中文，也可以输入英文、日文等其它语言名称。">
              <Input
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

          <FormField
            label="双语对照结果"
            message={result ? `检测语言：${result.detected_source_language} · 目标语言：${result.target_language}` : '提交后会展示双语对照结果。'}
          >
            <div className="min-h-[200px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-3 text-sm leading-7 text-[var(--color-text-primary)]">
              {result ? (
                <pre className="whitespace-pre-wrap break-words font-sans">{result.bilingual_markdown_result}</pre>
              ) : (
                <p className="text-[var(--color-text-secondary)]">AI 翻译完成后，会在这里展示双语对照 Markdown。</p>
              )}
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
              开始翻译
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
