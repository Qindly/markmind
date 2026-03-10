// DocumentListPanel.tsx - 渲染首页右侧文档列表与创建入口
import { Card, CardHeader } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import type { DocumentItem } from '../../../types/dashboard';
import { useVirtualListWindow } from '../useVirtualListWindow';
import { DocumentListContent } from './DocumentListContent';
import { DocumentListItem } from './DocumentListItem';
import { DocumentListToolbar } from './DocumentListToolbar';

const DOCUMENT_LIST_VIRTUAL_THRESHOLD = 40;
const DOCUMENT_LIST_ITEM_HEIGHT = 96;
const DOCUMENT_LIST_ITEM_GAP = 12;
const DOCUMENT_LIST_ROW_HEIGHT = DOCUMENT_LIST_ITEM_HEIGHT + DOCUMENT_LIST_ITEM_GAP;

export interface DocumentListPanelProps {
  currentFolderName: string;
  documents: DocumentItem[];
  totalDocumentCount: number;
  searchKeyword: string;
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
  onRequestMoveDocument: (document: DocumentItem) => void;
  onStartDocumentEditing: (document: DocumentItem) => void;
  onRequestDeleteDocument: (document: DocumentItem) => void;
  onChangeSearchKeyword: (value: string) => void;
  onClearSearch: () => void;
  onChangeEditingValue: (value: string) => void;
  onSubmitEditing: () => Promise<void>;
  onCancelEditing: () => void;
}

function getDocumentListDescription(totalDocumentCount: number, filteredDocumentCount: number, hasSearchKeyword: boolean): string {
  return hasSearchKeyword
    ? `当前目录共 ${totalDocumentCount} 篇文档，匹配到 ${filteredDocumentCount} 篇。`
    : `当前共展示 ${totalDocumentCount} 篇文档。`;
}

function getDocumentListHeight(itemCount: number): number {
  return itemCount === 0 ? 0 : itemCount * DOCUMENT_LIST_ITEM_HEIGHT + (itemCount - 1) * DOCUMENT_LIST_ITEM_GAP;
}

/**
 * DocumentListPanel - 首页右侧文档列表面板。
 * 参数 props: 当前目录、文档列表与相关交互回调。
 * 返回值：文档面板 JSX 结构。
 */
export function DocumentListPanel({
  currentFolderName,
  documents,
  totalDocumentCount,
  searchKeyword,
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
  onRequestMoveDocument,
  onStartDocumentEditing,
  onRequestDeleteDocument,
  onChangeSearchKeyword,
  onClearSearch,
  onChangeEditingValue,
  onSubmitEditing,
  onCancelEditing,
}: DocumentListPanelProps) {
  const hasSearchKeyword = searchKeyword.trim() !== '';
  const isVirtualListEnabled = !isLoading && editingDocumentId === null && documents.length > DOCUMENT_LIST_VIRTUAL_THRESHOLD;
  const { containerRef, startIndex, endIndex } = useVirtualListWindow({
    enabled: isVirtualListEnabled,
    itemCount: documents.length,
    rowHeight: DOCUMENT_LIST_ROW_HEIGHT,
  });
  const renderedDocuments = isVirtualListEnabled ? documents.slice(startIndex, endIndex) : documents;
  const totalHeight = getDocumentListHeight(documents.length);
  const renderedHeight = getDocumentListHeight(renderedDocuments.length);
  const listPaddingStyle = isVirtualListEnabled
    ? { paddingTop: startIndex * DOCUMENT_LIST_ROW_HEIGHT, paddingBottom: Math.max(0, totalHeight - startIndex * DOCUMENT_LIST_ROW_HEIGHT - renderedHeight) }
    : undefined;

  return (
    <Card className="flex min-h-[720px] flex-1 flex-col">
      <CardHeader className="border-b border-[var(--color-border-soft)] p-6 pb-5">
        <SectionHeader
          action={
            <DocumentListToolbar
              isCreatingDocument={isCreatingDocument}
              onChangeSearchKeyword={onChangeSearchKeyword}
              onClearSearch={onClearSearch}
              onCreateDocument={onCreateDocument}
              searchKeyword={searchKeyword}
            />
          }
          description={getDocumentListDescription(totalDocumentCount, documents.length, hasSearchKeyword)}
          eyebrow="Dashboard"
          title={currentFolderName}
        />
      </CardHeader>

      <DocumentListContent
        containerRef={containerRef}
        filteredDocuments={documents}
        isLoading={isLoading}
        listPaddingStyle={listPaddingStyle}
        onClearSearch={onClearSearch}
        renderDocumentItem={(document) => (
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
            onMove={() => onRequestMoveDocument(document)}
            onSelect={() => onSelectDocument(document.id)}
            onStartEdit={() => onStartDocumentEditing(document)}
            onSubmitEdit={onSubmitEditing}
          />
        )}
        renderedDocuments={renderedDocuments}
        searchKeyword={searchKeyword}
        totalDocumentCount={totalDocumentCount}
      />
    </Card>
  );
}
