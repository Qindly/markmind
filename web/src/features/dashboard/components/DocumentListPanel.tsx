// DocumentListPanel.tsx - 渲染首页右侧文档列表与创建入口
import { Button } from '../../../components/ui/Button';
import type { DocumentItem } from '../../../types/dashboard';
import { DocumentListItem } from './DocumentListItem';

export interface DocumentListPanelProps {
  currentFolderName: string;
  documents: DocumentItem[];
  selectedDocumentId: number | null;
  documentMenuId: number | null;
  editingDocumentId: number | null;
  editingValue: string;
  isLoading: boolean;
  isCreatingDocument: boolean;
  isUpdatingDocument: boolean;
  onCreateDocument: () => Promise<void>;
  onSelectDocument: (documentId: number) => void;
  onOpenDocumentMenu: (documentId: number) => void;
  onCloseDocumentMenu: () => void;
  onStartDocumentEditing: (document: DocumentItem) => void;
  onRequestDeleteDocument: (document: DocumentItem) => void;
  onChangeEditingValue: (value: string) => void;
  onSubmitEditing: () => Promise<void>;
  onCancelEditing: () => void;
}

/**
 * DocumentListPanel - 首页右侧文档列表面板。
 * 参数 props: 当前目录、文档列表与相关交互回调。
 * 返回值：文档面板 JSX 结构。
 */
export function DocumentListPanel({
  currentFolderName,
  documents,
  selectedDocumentId,
  documentMenuId,
  editingDocumentId,
  editingValue,
  isLoading,
  isCreatingDocument,
  isUpdatingDocument,
  onCreateDocument,
  onSelectDocument,
  onOpenDocumentMenu,
  onCloseDocumentMenu,
  onStartDocumentEditing,
  onRequestDeleteDocument,
  onChangeEditingValue,
  onSubmitEditing,
  onCancelEditing,
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
          ? documents.map((document) => (
              <DocumentListItem
                document={document}
                editingValue={editingValue}
                isEditing={editingDocumentId === document.id}
                isMenuOpen={documentMenuId === document.id}
                isSaving={isUpdatingDocument && editingDocumentId === document.id}
                isSelected={selectedDocumentId === document.id}
                key={document.id}
                onCancelEdit={onCancelEditing}
                onCloseMenu={onCloseDocumentMenu}
                onDelete={() => onRequestDeleteDocument(document)}
                onEditValueChange={onChangeEditingValue}
                onSelect={() => onSelectDocument(document.id)}
                onStartEdit={() => onStartDocumentEditing(document)}
                onSubmitEdit={onSubmitEditing}
                onToggleMenu={() => onOpenDocumentMenu(document.id)}
              />
            ))
          : null}
      </div>
    </section>
  );
}