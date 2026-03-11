// DocumentListToolbar.tsx - 渲染文档列表头部的搜索、排序与创建操作区
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { DocumentSortMode, SearchScope } from '../../../types/dashboard';
import { getSearchScopeLabel } from '../documentListPanelLayout';
import { DocumentSearchScopeToggle } from './DocumentSearchScopeToggle';
import { DocumentSortToggle } from './DocumentSortToggle';

export interface DocumentListToolbarProps {
  documentSortMode: DocumentSortMode;
  searchScope: SearchScope;
  searchKeyword: string;
  isSearchPending: boolean;
  searchResultCount: number | null;
  isCreatingDocument: boolean;
  onChangeSearchKeyword: (value: string) => void;
  onChangeSearchScope: (searchScope: SearchScope) => void;
  onChangeDocumentSortMode: (sortMode: DocumentSortMode) => void;
  onClearSearch: () => void;
  onCreateDocument: () => Promise<void>;
}

/**
 * DocumentListToolbar - 提供文档搜索输入、范围切换、排序切换与创建按钮。
 * 参数 props: 搜索状态、搜索范围、排序状态、创建状态与交互回调。
 * 返回值：头部操作区 JSX。
 */
export function DocumentListToolbar({
  documentSortMode,
  searchScope,
  searchKeyword,
  isSearchPending,
  searchResultCount,
  isCreatingDocument,
  onChangeSearchKeyword,
  onChangeSearchScope,
  onChangeDocumentSortMode,
  onClearSearch,
  onCreateDocument,
}: DocumentListToolbarProps) {
  const hasSearchKeyword = searchKeyword.trim() !== '';
  const searchSummaryText = !hasSearchKeyword ? null : isSearchPending ? '搜索中...' : searchResultCount === null ? null : `共 ${searchResultCount} 条结果`;
  const searchPlaceholder = `搜索${getSearchScopeLabel(searchScope)}中的标题或正文`;

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <Input
        className="w-full sm:w-72"
        onChange={(event) => onChangeSearchKeyword(event.target.value)}
        placeholder={searchPlaceholder}
        value={searchKeyword}
      />
      <DocumentSearchScopeToggle onChangeSearchScope={onChangeSearchScope} searchScope={searchScope} />
      <DocumentSortToggle onChangeSortMode={onChangeDocumentSortMode} sortMode={documentSortMode} />
      {searchSummaryText ? (
        <span className="inline-flex h-10 items-center rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 text-sm text-[var(--color-text-secondary)]">
          {searchSummaryText}
        </span>
      ) : null}
      {hasSearchKeyword ? (
        <Button className="h-10 w-full px-4 sm:w-auto" onClick={onClearSearch} type="button" variant="secondary">
          清空搜索
        </Button>
      ) : null}
      <Button
        className="h-10 w-full px-4 text-xs sm:w-auto"
        isLoading={isCreatingDocument}
        onClick={onCreateDocument}
        type="button"
        variant="secondary"
      >
        新建空文档
      </Button>
    </div>
  );
}
