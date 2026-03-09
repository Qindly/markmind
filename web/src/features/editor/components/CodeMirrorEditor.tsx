// CodeMirrorEditor.tsx - 封装编辑页使用的 CodeMirror 编辑器组件
import CodeMirror from '@uiw/react-codemirror';

import { createMarkdownEditorExtensions } from '../../../lib/codeMirror';

export interface CodeMirrorEditorProps {
  value: string;
  placeholder: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}

const markdownEditorExtensions = createMarkdownEditorExtensions();

/**
 * CodeMirrorEditor - 提供 Markdown 文档编辑所需的编辑器组件。
 * 参数 props: 当前正文、占位文案、只读状态与变更回调。
 * 返回值：编辑器 JSX 结构。
 */
export function CodeMirrorEditor({ value, placeholder, readOnly = false, onChange }: CodeMirrorEditorProps) {
  return (
    <div className="markmind-editor overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)]">
      <CodeMirror
        basicSetup={{
          foldGutter: false,
          highlightActiveLineGutter: false,
        }}
        editable={!readOnly}
        extensions={markdownEditorExtensions}
        height="62vh"
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        value={value}
      />
    </div>
  );
}
