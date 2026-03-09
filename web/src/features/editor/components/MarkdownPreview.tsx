// MarkdownPreview.tsx - 渲染基于 unified 管线生成的 Markdown 实时预览
import type { RefObject } from 'react';

import { useMermaidPreview } from '../useMermaidPreview';

export interface MarkdownPreviewProps {
  html: string;
  hasContent: boolean;
  previewContainerRef: RefObject<HTMLDivElement>;
}

/**
 * MarkdownPreview - 展示 Markdown 正文的实时 HTML 预览。
 * 参数 props: 当前预览 HTML、是否有内容和预览容器引用。
 * 返回值：预览区域 JSX 结构。
 */
export function MarkdownPreview({
  html,
  hasContent,
  previewContainerRef,
}: MarkdownPreviewProps) {
  useMermaidPreview({
    html,
    previewContainerRef,
  });

  if (!hasContent) {
    return (
      <div className="flex min-h-[62vh] items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-6 py-10 text-center">
        <p className="max-w-sm text-sm leading-7 text-[var(--color-text-secondary)]">
          开始输入 Markdown 内容后，这里会基于 unified 管线实时显示 GFM、公式、安全 HTML 与 Mermaid 预览。
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-[62vh] overflow-auto rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)]"
      ref={previewContainerRef}
    >
      <article className="markdown-preview px-5 py-4" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
