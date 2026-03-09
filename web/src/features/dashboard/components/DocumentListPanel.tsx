// DocumentListPanel.tsx - 渲染首页右侧文档列表与创建入口
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SectionHeader } from '../../../components/ui/SectionHeader';
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
  onCloseDocumentMenu: (documentId?: number) => void;
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
    <Card className="flex min-h-[720px] flex-1 flex-col">
      <CardHeader className="border-b border-[var(--color-border-soft)] p-6 pb-5">
        <SectionHeader
          action={
            <Button className="h-10 w-auto px-3 text-xs" isLoading={isCreatingDocument} onClick={onCreateDocument} type="button" variant="secondary">
              新建空文档
            </Button>
          }
          description={`当前共展示 ${documents.length} 篇文档。`}
          eyebrow="Dashboard"
          title={currentFolderName}
        />
      </CardHeader>

      <CardContent className="flex-1 space-y-3 overflow-y-auto p-6 pt-6">
        {isLoading ? (
          <EmptyState description="正在加载你的文档列表..." />
        ) : null}

        {!isLoading && documents.length === 0 ? (
          <EmptyState description="这个目录还没有文档，试试创建第一篇空文档吧。" title="还没有文档" />
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
                onDelete={() => onRequestDeleteDocument(document)}
                onEditValueChange={onChangeEditingValue}
                onMenuOpenChange={(open) => {
                  if (open) {
                    onOpenDocumentMenu(document.id);
                    return;
                  }

                  onCloseDocumentMenu(document.id);
                }}
                onSelect={() => onSelectDocument(document.id)}
                onStartEdit={() => onStartDocumentEditing(document)}
                onSubmitEdit={onSubmitEditing}
              />
            ))
          : null}
      </CardContent>
    </Card>
  );
}
