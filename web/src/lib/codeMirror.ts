// codeMirror.ts - 提供编辑器所需的 CodeMirror 扩展与主题配置
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import type { Extension } from '@uiw/react-codemirror';

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

export type ImagePasteHandler = (imageFiles: File[], view: EditorView) => void | Promise<void>;
export type EditorSelectionChangeHandler = (view: EditorView) => void;

// createMarkdownEditorExtensions - 生成 Markdown 编辑器所需的扩展集合。
// 参数 extraExtensions: 需要额外附加的扩展。
// 返回值：CodeMirror 扩展数组。
export function createMarkdownEditorExtensions(extraExtensions: Extension[] = []) {
  return [markdown(), EditorView.lineWrapping, markMindEditorTheme, ...extraExtensions];
}

// createPasteImageExtension - 创建编辑器图片粘贴上传扩展。
// 参数 onImagePaste: 当检测到剪贴板图片时的处理函数。
// 返回值：CodeMirror 粘贴事件扩展。
export function createPasteImageExtension(onImagePaste: ImagePasteHandler) {
  return EditorView.domEventHandlers({
    paste(event, view) {
      const clipboardData = event.clipboardData;
      if (!clipboardData) {
        return false;
      }

      const imageFiles = Array.from(clipboardData.items)
        .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      if (imageFiles.length === 0) {
        return false;
      }

      event.preventDefault();
      void onImagePaste(imageFiles, view);
      return true;
    },
  });
}

// createSelectionChangeExtension - 创建编辑器选区与视图变化监听扩展。
// 参数 onSelectionChange: 当选区、焦点或视图布局变化时的回调。
// 返回值：CodeMirror 选区变化监听扩展。
export function createSelectionChangeExtension(onSelectionChange: EditorSelectionChangeHandler) {
  return EditorView.updateListener.of((update) => {
    if (update.selectionSet || update.focusChanged || update.geometryChanged || update.viewportChanged) {
      onSelectionChange(update.view);
    }
  });
}
