// buildEditorTocTree.ts - 根据标题数组构建可折叠的 TOC 树结构
import type { MarkdownHeading } from '../../lib/markdownPreview';

export interface EditorTocNode extends MarkdownHeading {
  children: EditorTocNode[];
}

export interface EditorTocTreeResult {
  tree: EditorTocNode[];
  ancestorMap: Record<string, string[]>;
  expandableIds: string[];
}

// buildEditorTocTree - 将扁平标题数组转换为树形 TOC。
// 参数 headings: 经过 unified 提取后的标题数组。
// 返回值：TOC 树、祖先映射和可折叠节点 ID 列表。
export function buildEditorTocTree(headings: MarkdownHeading[]): EditorTocTreeResult {
  const tree: EditorTocNode[] = [];
  const ancestorMap: Record<string, string[]> = {};
  const stack: EditorTocNode[] = [];

  headings.forEach((heading) => {
    const node: EditorTocNode = {
      ...heading,
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      tree.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    ancestorMap[node.id] = stack.map((item) => item.id);
    stack.push(node);
  });

  const expandableIds: string[] = [];

  function collectExpandableIds(nodes: EditorTocNode[]) {
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        expandableIds.push(node.id);
        collectExpandableIds(node.children);
      }
    });
  }

  collectExpandableIds(tree);

  return {
    tree,
    ancestorMap,
    expandableIds,
  };
}
