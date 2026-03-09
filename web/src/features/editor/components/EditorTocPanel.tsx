// EditorTocPanel.tsx - 渲染编辑页左侧的目录导航面板
import type { EditorTocNode } from '../buildEditorTocTree';
import { EditorTocItem } from './EditorTocItem';

export interface EditorTocPanelProps {
  tocTree: EditorTocNode[];
  activeHeadingId: string | null;
  expandedState: Record<string, boolean>;
  onSelect: (headingId: string) => void;
  onToggle: (headingId: string) => void;
}

/**
 * EditorTocPanel - 展示可折叠目录树与当前激活标题。
 * 参数 props: 目录树、激活态、折叠状态和交互回调。
 * 返回值：目录导航面板 JSX 结构。
 */
export function EditorTocPanel({
  tocTree,
  activeHeadingId,
  expandedState,
  onSelect,
  onToggle,
}: EditorTocPanelProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-5">
      <div className="space-y-1">
        <h2 className="text-sm font-medium text-[var(--color-text-primary)]">目录导航</h2>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          点击标题定位右侧预览，滚动预览时这里也会自动同步当前章节。
        </p>
      </div>

      {tocTree.length > 0 ? (
        <div className="max-h-[48vh] overflow-auto pr-1">
          <ul className="space-y-1">
            {tocTree.map((node) => (
              <EditorTocItem
                activeHeadingId={activeHeadingId}
                expandedState={expandedState}
                key={node.id}
                node={node}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-6 text-center">
          <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
            当前文档还没有可导航的标题，输入一级到六级标题后就会显示在这里。
          </p>
        </div>
      )}
    </section>
  );
}
