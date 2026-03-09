// codeMirror.ts - 提供编辑器所需的 CodeMirror 扩展与主题配置
import { EditorView } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';

const markMindEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-page-bg)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    fontFamily:
      "ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    lineHeight: '1.75',
  },
  '.cm-content': {
    minHeight: '62vh',
    padding: '0.875rem 1rem 1.5rem',
    caretColor: 'var(--color-text-primary)',
  },
  '.cm-line': {
    padding: 0,
  },
  '.cm-gutters': {
    minHeight: '62vh',
    borderRight: '1px solid var(--color-border-soft)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(20, 20, 19, 0.04)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(20, 20, 19, 0.1)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--color-text-primary)',
  },
  '.cm-placeholder': {
    color: 'var(--color-text-secondary)',
  },
});

// createMarkdownEditorExtensions - 生成 Markdown 编辑器所需的扩展集合。
// 返回值：CodeMirror 扩展数组。
export function createMarkdownEditorExtensions() {
  return [markdown(), EditorView.lineWrapping, markMindEditorTheme];
}
