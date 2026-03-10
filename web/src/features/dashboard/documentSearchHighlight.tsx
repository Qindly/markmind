// documentSearchHighlight.tsx - 提供 Dashboard 搜索结果文本高亮工具
import type { ReactNode } from 'react';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// renderSearchHighlightedText - 在纯文本中高亮当前搜索关键字。
// 参数 text: 待展示的原始文本。
// 参数 keyword: 当前搜索关键字。
// 参数 matchedClassName: 命中片段的高亮样式类名。
// 返回值：带高亮标记的 React 节点。
export function renderSearchHighlightedText(
  text: string,
  keyword: string,
  matchedClassName: string,
): ReactNode {
  const normalizedKeyword = keyword.trim();
  if (normalizedKeyword === '' || text === '') {
    return text;
  }

  const pattern = new RegExp(`(${escapeRegExp(normalizedKeyword)})`, 'ig');
  const keywordLower = normalizedKeyword.toLowerCase();

  return text.split(pattern).map((part, index) => {
    if (part.toLowerCase() !== keywordLower) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return (
      <mark className={matchedClassName} key={`${part}-${index}`}>
        {part}
      </mark>
    );
  });
}
