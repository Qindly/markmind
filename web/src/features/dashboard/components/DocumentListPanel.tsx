// DocumentListPanel.tsx - 渲染首页右侧文档列表与创建入口
import { Card, CardHeader } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import type { DashboardDocumentListItem, DocumentItem, DocumentSortMode, SearchScope } from '../../../types/dashboard';
import {
  DOCUMENT_LIST_ROW_HEIGHT,
  DOCUMENT_LIST_VIRTUAL_THRESHOLD,
  getDocumentListDescription,
  getDocumentListHeight,
} from '../documentListPanelLayout';
import { useVirtualListWindow } from '../useVirtualListWindow';
import { DocumentListContent } from './DocumentListContent';
import { DocumentListItem } from './DocumentListItem';
import { DocumentListToolbar } from './DocumentListToolbar';

export interface DocumentListPanelProps {
  panelTitle: string;
  documents: DashboardDocumentListItem[];
  totalDocumentCount: number;
  documentSortMode: DocumentSortMode;
  searchScope: SearchScope;
  isGlobalSearchActive: boolean;
  searchKeyword: string;
  isSearchPending: boolean;
  searchResultCount: number | null;
  isSearchingDocuments: boolean;
  searchErrorMessage: string;
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
  onChangeSearchScope: (searchScope: SearchScope) => void;
  onChangeDocumentSortMode: (sortMode: DocumentSortMode) => void;
  onClearSearch: () => void;
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
  panelTitle,
  documents,
  totalDocumentCount,
  documentSortMode,
  searchScope,
  isGlobalSearchActive,
  searchKeyword,
  isSearchPending,
  searchResultCount,
  isSearchingDocuments,
  searchErrorMessage,
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
  onChangeSearchScope,
  onChangeDocumentSortMode,
  onClearSearch,
  onChangeEditingValue,
  onSubmitEditing,
  onCancelEditing,
}: DocumentListPanelProps) {
  const hasSearchKeyword = searchKeyword.trim() !== '';
  // 搜索结果卡片会因为摘要和标签变成可变高度，固定行高虚拟列表在这里会算错滚动占位。
  // 因此只在普通列表模式下启用虚拟列表，搜索时统一回退为全量渲染。
  const isVirtualListEnabled =
    !isLoading &&
    !hasSearchKeyword &&
    editingDocumentId === null &&
    documents.length > DOCUMENT_LIST_VIRTUAL_THRESHOLD;
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
              documentSortMode={documentSortMode}
              isCreatingDocument={isCreatingDocument}
              isSearchPending={isSearchPending}
              onChangeSearchScope={onChangeSearchScope}
              onChangeDocumentSortMode={onChangeDocumentSortMode}
              onChangeSearchKeyword={onChangeSearchKeyword}
              onClearSearch={onClearSearch}
              onCreateDocument={onCreateDocument}
              searchResultCount={searchResultCount}
              searchKeyword={searchKeyword}
              searchScope={searchScope}
            />
          }
          description={getDocumentListDescription(totalDocumentCount, hasSearchKeyword, isSearchPending, searchScope)}
          eyebrow="Dashboard"
          title={panelTitle}
        />
      </CardHeader>

      <DocumentListContent
        containerRef={containerRef}
        filteredDocuments={documents}
        isLoading={isLoading}
        isSearchingDocuments={isSearchingDocuments}
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
            searchKeyword={searchKeyword}
            showFolderName={isGlobalSearchActive}
            onStartEdit={() => onStartDocumentEditing(document)}
            onSubmitEdit={onSubmitEditing}
          />
        )}
        renderedDocuments={renderedDocuments}
        searchScope={searchScope}
        searchErrorMessage={searchErrorMessage}
        searchKeyword={searchKeyword}
        totalDocumentCount={totalDocumentCount}
      />
    </Card>
  );
}
