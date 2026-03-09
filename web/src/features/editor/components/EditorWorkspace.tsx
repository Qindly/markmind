// EditorWorkspace.tsx - 渲染编辑页的正文编辑骨架与保存操作区
import { Alert, AlertDescription } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Textarea } from '../../../components/ui/Textarea';
import { cn } from '../../../lib/cn';
import type { DocumentDetail } from '../../../types/document';

export interface EditorWorkspaceProps {
  document: DocumentDetail;
  content: string;
  errorMessage: string;
  statusMessage: string;
  isDirty: boolean;
  isSaving: boolean;
  onBack: () => void;
  onContentChange: (value: string) => void;
  onSave: () => Promise<void>;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '时间未知';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * EditorWorkspace - 展示编辑页标题、只读信息区与正文编辑区域。
 * 参数 props: 文档数据、保存状态与交互回调。
 * 返回值：编辑页主体 JSX 结构。
 */
export function EditorWorkspace({
  document,
  content,
  errorMessage,
  statusMessage,
  isDirty,
  isSaving,
  onBack,
  onContentChange,
  onSave,
}: EditorWorkspaceProps) {
  return (
    <main className="min-h-screen px-3 py-4 text-[var(--color-text-primary)] sm:px-4 sm:py-5">
      <div className="flex w-full flex-col gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[var(--color-border-soft)] p-6 pb-5">
            <SectionHeader
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <Button className="w-auto" onClick={onBack} size="sm" type="button" variant="secondary">
                    返回首页
                  </Button>
                  <Button className="w-auto" disabled={!isDirty} isLoading={isSaving} onClick={() => void onSave()} size="sm" type="button">
                    保存内容
                  </Button>
                </div>
              }
              description={`文档 #${document.id} · 最近更新于 ${formatDateTime(document.updated_at)}`}
              eyebrow="Editor"
              title={document.title}
            />
          </CardHeader>

          <CardContent className="space-y-5 p-6 pt-6">
            {errorMessage ? (
              <Alert className="shadow-none" variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
              <section className="space-y-4 rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-5">
                <FormField label="文档标题" message="本次 P0 阶段先只展示标题，重命名仍在首页列表完成。">
                  <Input readOnly value={document.title} />
                </FormField>
                <FormField label="保存状态" message="下一步会继续接入自动保存、CodeMirror 和实时预览。">
                  <Input
                    className={cn(
                      isDirty ? 'border-[var(--color-border-strong)] text-[var(--color-text-primary)]' : undefined,
                    )}
                    readOnly
                    value={statusMessage}
                  />
                </FormField>
                <FormField label="创建时间">
                  <Input readOnly value={formatDateTime(document.created_at)} />
                </FormField>
              </section>

              <section className="space-y-4 rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-5">
                <FormField
                  label="Markdown 正文"
                  message="本次 P0 先使用基础多行输入框打通编辑闭环，后续再接入 CodeMirror。"
                >
                  <Textarea
                    className="min-h-[62vh] resize-y"
                    onChange={(event) => onContentChange(event.target.value)}
                    placeholder="请输入 Markdown 内容..."
                    value={content}
                  />
                </FormField>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
