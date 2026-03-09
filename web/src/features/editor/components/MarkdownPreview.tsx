// MarkdownPreview.tsx - 渲染基于 unified 管线生成的 Markdown 实时预览
import { useMemo } from 'react';

import { renderMarkdownToHtml } from '../../../lib/markdownPreview';

export interface MarkdownPreviewProps {
  content: string;
}

/**
 * MarkdownPreview - 展示 Markdown 正文的实时 HTML 预览。
 * 参数 props: 当前 Markdown 正文内容。
 * 返回值：预览区域 JSX 结构。
 */
export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const preview = useMemo(() => {
    if (!content.trim()) {
      return { html: '', hasContent: false };
    }

    return {
      html: renderMarkdownToHtml(content),
      hasContent: true,
    };
  }, [content]);

  if (!preview.hasContent) {
    return (
      <div className="flex min-h-[62vh] items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-6 py-10 text-center">
        <p className="max-w-sm text-sm leading-7 text-[var(--color-text-secondary)]">
          开始输入 Markdown 内容后，这里会基于 unified 管线实时显示 GFM 预览。
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[62vh] overflow-auto rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)]">
      <article className="markdown-preview px-5 py-4" dangerouslySetInnerHTML={{ __html: preview.html }} />
    </div>
  );
}
