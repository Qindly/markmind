// MarkdownPreview.tsx - 渲染基于 unified 管线生成的 Markdown 实时预览
import type { RefObject } from 'react';

import { useSpecialCodeBlockPreview } from '../useSpecialCodeBlockPreview';

export interface MarkdownPreviewProps {
  html: string;
  hasContent: boolean;
  isRendering: boolean;
  errorMessage: string;
  previewContainerRef: RefObject<HTMLDivElement>;
}

/**
 * MarkdownPreview - 展示 Markdown 正文的实时 HTML 预览。
 * 参数 props: 当前预览 HTML、是否有内容、加载状态、错误信息和预览容器引用。
 * 返回值：预览区域 JSX 结构。
 */
export function MarkdownPreview({
  html,
  hasContent,
  isRendering,
  errorMessage,
  previewContainerRef,
}: MarkdownPreviewProps) {
  useSpecialCodeBlockPreview({
    html,
    previewContainerRef,
  });

  if (!hasContent) {
    return (
      <div className="flex min-h-[62vh] items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-6 py-10 text-center">
        <p className="max-w-sm text-sm leading-7 text-[var(--color-text-secondary)]">
          开始输入 Markdown 内容后，这里会基于 unified 管线实时显示 GFM、公式、安全 HTML 与按需加载的特殊代码块预览。
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex min-h-[62vh] items-center justify-center rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] px-6 py-10 text-center">
        <p className="max-w-lg text-sm leading-7 text-[var(--color-danger-text)]">{errorMessage}</p>
      </div>
    );
  }

  if (isRendering && !html) {
    return (
      <div className="flex min-h-[62vh] items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-6 py-10 text-center">
        <p className="max-w-sm text-sm leading-7 text-[var(--color-text-secondary)]">
          正在生成预览，请稍候...
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
