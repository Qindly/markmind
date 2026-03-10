// DocumentListContent.tsx - 渲染文档列表区域的空状态、搜索空状态和文档项内容
import type { CSSProperties, ReactNode, RefObject } from 'react';

import { CardContent } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { DashboardDocumentListItem } from '../../../types/dashboard';
import { DocumentSearchEmptyState } from './DocumentSearchEmptyState';

export interface DocumentListContentProps {
  containerRef: RefObject<HTMLDivElement>;
  isLoading: boolean;
  isSearchingDocuments: boolean;
  searchErrorMessage: string;
  totalDocumentCount: number;
  filteredDocuments: DashboardDocumentListItem[];
  renderedDocuments: DashboardDocumentListItem[];
  searchKeyword: string;
  listPaddingStyle?: CSSProperties;
  renderDocumentItem: (document: DashboardDocumentListItem) => ReactNode;
  onClearSearch: () => void;
}

/**
 * DocumentListContent - 展示文档列表区域的加载态、空态和文档项内容。
 * 参数 props: 列表容器、过滤结果、渲染回调与清空搜索回调。
 * 返回值：列表正文 JSX。
 */
export function DocumentListContent({
  containerRef,
  isLoading,
  isSearchingDocuments,
  searchErrorMessage,
  totalDocumentCount,
  filteredDocuments,
  renderedDocuments,
  searchKeyword,
  listPaddingStyle,
  renderDocumentItem,
  onClearSearch,
}: DocumentListContentProps) {
  return (
    <CardContent className="flex-1 overflow-y-auto p-6 pt-6" ref={containerRef}>
      {isLoading ? <EmptyState description="正在加载你的文档列表..." /> : null}

      {!isLoading && isSearchingDocuments ? (
        <EmptyState description="正在搜索当前目录中的标题和正文..." title="搜索中" />
      ) : null}

      {!isLoading && !isSearchingDocuments && totalDocumentCount === 0 ? (
        <EmptyState description="这个目录还没有文档，试试创建第一篇空文档吧。" title="还没有文档" />
      ) : null}

      {!isLoading && !isSearchingDocuments && searchErrorMessage ? (
        <EmptyState description={searchErrorMessage} title="搜索失败" />
      ) : null}

      {!isLoading && !isSearchingDocuments && !searchErrorMessage && totalDocumentCount > 0 && filteredDocuments.length === 0 ? (
        <DocumentSearchEmptyState onClearSearch={onClearSearch} searchKeyword={searchKeyword} />
      ) : null}

      {!isLoading && !isSearchingDocuments && filteredDocuments.length > 0 ? (
        <div className="space-y-3" style={listPaddingStyle}>
          {renderedDocuments.map(renderDocumentItem)}
        </div>
      ) : null}
    </CardContent>
  );
}
