// documentListPanelLayout.ts - 管理 Dashboard 文档列表面板的布局常量与描述文案
export const DOCUMENT_LIST_VIRTUAL_THRESHOLD = 40;
export const DOCUMENT_LIST_ITEM_HEIGHT = 96;
export const DOCUMENT_LIST_ITEM_GAP = 12;
export const DOCUMENT_LIST_ROW_HEIGHT = DOCUMENT_LIST_ITEM_HEIGHT + DOCUMENT_LIST_ITEM_GAP;

// getDocumentListDescription - 生成列表头部的结果描述文案。
// 参数 totalDocumentCount: 当前目录文档总数。
// 参数 filteredDocumentCount: 当前展示结果数量。
// 参数 hasSearchKeyword: 是否已输入关键字。
// 参数 isSearchingDocuments: 当前是否仍在搜索。
// 返回值：头部描述文案。
export function getDocumentListDescription(
  totalDocumentCount: number,
  filteredDocumentCount: number,
  hasSearchKeyword: boolean,
  isSearchingDocuments: boolean,
): string {
  if (hasSearchKeyword && isSearchingDocuments) {
    return `当前目录共 ${totalDocumentCount} 篇文档，正在搜索标题和正文...`;
  }

  return hasSearchKeyword
    ? `当前目录共 ${totalDocumentCount} 篇文档，匹配到 ${filteredDocumentCount} 篇。`
    : `当前共展示 ${totalDocumentCount} 篇文档。`;
}

// getDocumentListHeight - 计算当前列表的理论总高度。
// 参数 itemCount: 当前列表项数量。
// 返回值：列表总高度。
export function getDocumentListHeight(itemCount: number): number {
  return itemCount === 0 ? 0 : itemCount * DOCUMENT_LIST_ITEM_HEIGHT + (itemCount - 1) * DOCUMENT_LIST_ITEM_GAP;
}
