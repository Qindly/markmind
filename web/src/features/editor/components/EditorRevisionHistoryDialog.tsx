// EditorRevisionHistoryDialog.tsx - 展示编辑页历史版本列表、diff 与回滚操作
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
import type {
  DocumentRevisionDiff,
  DocumentRevisionDiffLine,
  DocumentRevisionOperation,
  DocumentRevisionSummary,
} from '../../../types/document';
import { formatEditorDateTime } from '../formatEditorDateTime';

export interface EditorRevisionHistoryDialogProps {
  open: boolean;
  revisions: DocumentRevisionSummary[];
  currentRevision: DocumentRevisionSummary | null;
  selectedRevision: DocumentRevisionSummary | null;
  diff: DocumentRevisionDiff | null;
  errorMessage: string;
  hasUnversionedContent: boolean;
  isDirty: boolean;
  isSaving: boolean;
  isLoadingRevisions: boolean;
  isLoadingDiff: boolean;
  isRollingBack: boolean;
  canRollback: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRevision: (revisionID: number) => void;
  onRollback: () => Promise<void>;
}

const revisionOperationLabelMap: Record<DocumentRevisionOperation, string> = {
  create: '创建快照',
  update: '正文保存',
  rollback: '历史回滚',
  seed: '历史导入',
};

function getDiffLineClassName(diffLine: DocumentRevisionDiffLine): string {
  if (diffLine.type === 'insert') {
    return 'bg-[rgba(61,128,94,0.10)] text-[var(--color-text-primary)]';
  }

  if (diffLine.type === 'delete') {
    return 'bg-[rgba(184,91,81,0.10)] text-[var(--color-text-primary)]';
  }

  return 'bg-transparent text-[var(--color-text-secondary)]';
}

function renderLineNumber(value: number | null): string {
  return value === null ? '' : String(value);
}

export function EditorRevisionHistoryDialog({
  open,
  revisions,
  currentRevision,
  selectedRevision,
  diff,
  errorMessage,
  hasUnversionedContent,
  isDirty,
  isSaving,
  isLoadingRevisions,
  isLoadingDiff,
  isRollingBack,
  canRollback,
  onOpenChange,
  onSelectRevision,
  onRollback,
}: EditorRevisionHistoryDialogProps) {
  const comparisonLabel =
    diff === null
      ? '请选择一个历史版本查看差异。'
      : `对比版本：#${diff.from_revision.revision_number} -> #${diff.to_revision.revision_number}`;

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-6xl">
        <AlertDialogHeader>
          <AlertDialogTitle>历史版本</AlertDialogTitle>
          <AlertDialogDescription>
            基于文本快照查看文档历史版本、逐行 diff，并支持回滚到任意已保存版本。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          {isDirty || isSaving ? (
            <Alert>
              <AlertDescription>
                当前存在未保存改动或仍在保存中。你可以先查看历史版本，但回滚操作会在当前内容保存稳定后开放。
              </AlertDescription>
            </Alert>
          ) : null}

          {hasUnversionedContent ? (
            <Alert>
              <AlertDescription>
                当前内容只做了自动保存，还没有进入历史版本。列表和 diff 仍以最近一次手动保存的版本为准；如果要回滚，请先手动保存。
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <section className="space-y-3 rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-[var(--color-text-primary)]">版本列表</h3>
                <p className="text-xs leading-6 text-[var(--color-text-secondary)]">
                  {currentRevision ? `最近一次手动保存版本是 #${currentRevision.revision_number}` : '正在加载版本列表...'}
                </p>
              </div>

              <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
                {isLoadingRevisions ? (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] px-4 py-6 text-sm text-[var(--color-text-secondary)]">
                    正在加载历史版本...
                  </div>
                ) : revisions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] px-4 py-6 text-sm text-[var(--color-text-secondary)]">
                    当前文档还没有可用的历史版本。
                  </div>
                ) : (
                  revisions.map((revision) => {
                    const isCurrent = currentRevision?.id === revision.id;
                    const isSelected = selectedRevision?.id === revision.id;

                    return (
                      <button
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          isSelected
                            ? 'border-[var(--color-border-strong)] bg-[rgba(20,20,19,0.04)]'
                            : 'border-[var(--color-border-soft)] bg-[var(--color-page-bg)] hover:border-[var(--color-border-strong)]'
                        }`}
                        key={revision.id}
                        onClick={() => onSelectRevision(revision.id)}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">
                            版本 #{revision.revision_number}
                          </p>
                          {isCurrent ? (
                            <span className="rounded-full bg-[rgba(20,20,19,0.08)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                              当前
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                          {revisionOperationLabelMap[revision.operation]} · {formatEditorDateTime(revision.created_at)}
                        </p>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-primary)]">
                          {revision.preview}
                        </p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                          {revision.content_size} 字符
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="space-y-3 rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-[var(--color-text-primary)]">文本 Diff</h3>
                <p className="text-xs leading-6 text-[var(--color-text-secondary)]">{comparisonLabel}</p>
              </div>

              {diff ? (
                <div className="flex flex-wrap gap-2 text-xs leading-6 text-[var(--color-text-secondary)]">
                  <span className="rounded-full bg-[rgba(61,128,94,0.10)] px-3 py-1">
                    +{diff.stats.added_lines} 行新增
                  </span>
                  <span className="rounded-full bg-[rgba(184,91,81,0.10)] px-3 py-1">
                    -{diff.stats.deleted_lines} 行删除
                  </span>
                  <span className="rounded-full bg-[rgba(20,20,19,0.05)] px-3 py-1">
                    {diff.stats.unchanged_lines} 行未变更
                  </span>
                </div>
              ) : null}

              <div className="max-h-[52vh] overflow-y-auto rounded-2xl border border-[var(--color-border-soft)] bg-[rgba(20,20,19,0.02)]">
                {isLoadingDiff ? (
                  <div className="px-4 py-6 text-sm text-[var(--color-text-secondary)]">正在加载版本差异...</div>
                ) : diff ? (
                  <div className="font-mono text-xs leading-6">
                    {diff.lines.map((diffLine, lineIndex) => (
                      <div
                        className={`grid grid-cols-[72px_72px_minmax(0,1fr)] border-b border-[rgba(20,20,19,0.04)] ${getDiffLineClassName(diffLine)}`}
                        key={`${diffLine.type}-${lineIndex}-${diffLine.old_line_number ?? 'old'}-${diffLine.new_line_number ?? 'new'}`}
                      >
                        <span className="px-3 py-1 text-right text-[var(--color-text-muted)]">
                          {renderLineNumber(diffLine.old_line_number)}
                        </span>
                        <span className="px-3 py-1 text-right text-[var(--color-text-muted)]">
                          {renderLineNumber(diffLine.new_line_number)}
                        </span>
                        <pre className="overflow-x-auto whitespace-pre-wrap break-words px-3 py-1">
                          {diffLine.content === '' ? ' ' : diffLine.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-sm text-[var(--color-text-secondary)]">
                    {revisions.length <= 1
                      ? '当前只有一个已保存版本，继续编辑并保存后这里会显示逐行差异。'
                      : '请选择一个历史版本查看与最近一次手动保存版本的差异。'}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <AlertDialogFooter className="flex-wrap gap-2">
          <Button onClick={() => onOpenChange(false)} type="button" variant="secondary">
            关闭
          </Button>
          <Button
            disabled={!canRollback}
            isLoading={isRollingBack}
            onClick={() => void onRollback()}
            type="button"
          >
            回滚到所选版本
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
