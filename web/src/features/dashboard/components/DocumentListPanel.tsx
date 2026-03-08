// DocumentListPanel.tsx - 渲染首页右侧文档列表与创建入口
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';
import type { DocumentItem } from '../../../types/dashboard';

export interface DocumentListPanelProps {
  currentFolderName: string;
  documents: DocumentItem[];
  selectedDocumentId: number | null;
  isLoading: boolean;
  isCreatingDocument: boolean;
  onCreateDocument: () => Promise<void>;
  onSelectDocument: (documentId: number) => void;
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '更新时间未知';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * DocumentListPanel - 首页右侧文档列表面板
 * 参数 props: 当前目录、文档列表与相关交互回调
 * 返回值：文档面板 JSX 结构
 */
export function DocumentListPanel({
  currentFolderName,
  documents,
  selectedDocumentId,
  isLoading,
  isCreatingDocument,
  onCreateDocument,
  onSelectDocument,
}: DocumentListPanelProps) {
  return (
    <section className="flex min-h-[720px] flex-1 flex-col rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border-soft)] pb-5">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">{currentFolderName}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">当前共展示 {documents.length} 篇文档。</p>
        </div>
        <Button className="h-10 w-auto px-3 text-xs" isLoading={isCreatingDocument} onClick={onCreateDocument} type="button" variant="secondary">
          新建空文档
        </Button>
      </div>

      <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-5 py-6 text-sm text-[var(--color-text-secondary)]">
            正在加载你的文档列表...
          </div>
        ) : null}

        {!isLoading && documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-5 py-8 text-sm text-[var(--color-text-secondary)]">
            这个目录还没有文档，试试创建第一篇空文档吧。
          </div>
        ) : null}

        {!isLoading
          ? documents.map((document) => {
              const isSelected = selectedDocumentId === document.id;
              return (
                <button
                  className={cn(
                    'flex w-full flex-col rounded-2xl border px-5 py-4 text-left transition',
                    isSelected
                      ? 'border-[var(--color-option-selected)] bg-[var(--color-option-selected)] text-[var(--color-option-selected-text)]'
                      : 'border-[var(--color-border-soft)] bg-[var(--color-page-bg)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-button-light-hover)]',
                  )}
                  key={document.id}
                  onClick={() => onSelectDocument(document.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="truncate text-base font-medium">{document.title}</span>
                    <span className={cn('text-xs', isSelected ? 'text-[var(--color-option-selected-muted)]' : 'text-[var(--color-text-muted)]')}>#{document.id}</span>
                  </div>
                  <p className={cn('mt-3 text-sm', isSelected ? 'text-[var(--color-option-selected-muted)]' : 'text-[var(--color-text-muted)]')}>
                    更新时间：{formatUpdatedAt(document.updated_at)}
                  </p>
                </button>
              );
            })
          : null}
      </div>
    </section>
  );
}
