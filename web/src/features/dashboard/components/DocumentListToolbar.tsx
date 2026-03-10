// DocumentListToolbar.tsx - 渲染文档列表头部的搜索与创建操作区
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export interface DocumentListToolbarProps {
  searchKeyword: string;
  isSearchingDocuments: boolean;
  isCreatingDocument: boolean;
  onChangeSearchKeyword: (value: string) => void;
  onClearSearch: () => void;
  onCreateDocument: () => Promise<void>;
}

/**
 * DocumentListToolbar - 提供文档搜索输入、清空搜索和新建文档按钮。
 * 参数 props: 搜索状态、创建状态与交互回调。
 * 返回值：头部操作区 JSX。
 */
export function DocumentListToolbar({
  searchKeyword,
  isSearchingDocuments,
  isCreatingDocument,
  onChangeSearchKeyword,
  onClearSearch,
  onCreateDocument,
}: DocumentListToolbarProps) {
  const hasSearchKeyword = searchKeyword !== '';

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
      <Input
        className="w-full sm:w-72"
        onChange={(event) => onChangeSearchKeyword(event.target.value)}
        placeholder="搜索当前目录中的标题或正文"
        value={searchKeyword}
      />
      {isSearchingDocuments ? <span className="text-sm text-[var(--color-text-secondary)]">搜索中...</span> : null}
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
