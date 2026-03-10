// documentSort.ts - 提供 Dashboard 文档列表排序模式与排序函数
import type { DocumentItem, DocumentSortMode } from '../../types/dashboard';

export const DEFAULT_DOCUMENT_SORT_MODE: DocumentSortMode = 'updated_desc';

function compareByUpdatedAtDesc(left: DocumentItem, right: DocumentItem): number {
  const timeDelta = new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
  if (timeDelta !== 0) {
    return timeDelta;
  }

  return right.id - left.id;
}

function compareByTitleAsc(left: DocumentItem, right: DocumentItem): number {
  const titleDelta = left.title.localeCompare(right.title, 'zh-CN', {
    numeric: true,
    sensitivity: 'base',
  });
  if (titleDelta !== 0) {
    return titleDelta;
  }

  return compareByUpdatedAtDesc(left, right);
}

// sortDocuments - 按当前排序模式整理文档列表。
// 参数 documents: 待排序的文档数组。
// 参数 sortMode: 当前选中的排序模式。
// 返回值：新的有序文档数组。
export function sortDocuments<T extends DocumentItem>(documents: T[], sortMode: DocumentSortMode): T[] {
  return [...documents].sort((left, right) => {
    if (sortMode === 'title_asc') {
      return compareByTitleAsc(left, right);
    }

    return compareByUpdatedAtDesc(left, right);
  });
}
