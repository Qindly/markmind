// EditorTocItem.tsx - 递归渲染可折叠的 TOC 树节点
import { ChevronRight } from 'lucide-react';

import { cn } from '../../../lib/cn';
import type { EditorTocNode } from '../buildEditorTocTree';

export interface EditorTocItemProps {
  node: EditorTocNode;
  activeHeadingId: string | null;
  expandedState: Record<string, boolean>;
  onSelect: (headingId: string) => void;
  onToggle: (headingId: string) => void;
}

/**
 * EditorTocItem - 渲染单个目录节点与其子节点。
 * 参数 props: 当前节点、激活态、折叠状态和点击回调。
 * 返回值：目录树节点 JSX 结构。
 */
export function EditorTocItem({
  node,
  activeHeadingId,
  expandedState,
  onSelect,
  onToggle,
}: EditorTocItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = hasChildren ? expandedState[node.id] !== false : false;
  const isActive = activeHeadingId === node.id;

  return (
    <li className="space-y-1">
      <div className="flex items-center gap-1">
        {hasChildren ? (
          <button
            aria-expanded={isExpanded}
            className={cn(
              'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-transparent text-[var(--color-text-secondary)] transition hover:bg-[var(--color-button-light-hover)] hover:text-[var(--color-text-primary)]',
              isActive &&
                'bg-[var(--color-option-selected)] text-[var(--color-option-selected-text)] hover:bg-[var(--color-option-selected)] hover:text-[var(--color-option-selected-text)]',
            )}
            onClick={() => onToggle(node.id)}
            title={isExpanded ? '收起子标题' : '展开子标题'}
            type="button"
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} />
          </button>
        ) : (
          <span aria-hidden className="h-8 w-8 shrink-0" />
        )}

        <button
          aria-current={isActive ? 'location' : undefined}
          className={cn(
            'w-full rounded-xl border border-transparent px-2.5 py-2 text-left text-sm leading-6 transition',
            node.depth === 1 ? 'font-medium' : 'font-normal',
            isActive
              ? 'border-[var(--color-border-soft)] bg-[var(--color-option-selected)] text-[var(--color-option-selected-text)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-button-light-hover)] hover:text-[var(--color-text-primary)]',
          )}
          onClick={() => onSelect(node.id)}
          title={node.text}
          type="button"
        >
          <span className="block truncate">{node.text}</span>
        </button>
      </div>

      {hasChildren && isExpanded ? (
        <ul className="space-y-1 pl-4">
          {node.children.map((childNode) => (
            <EditorTocItem
              activeHeadingId={activeHeadingId}
              expandedState={expandedState}
              key={childNode.id}
              node={childNode}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
