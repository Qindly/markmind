// MarkdownPreview.tsx - render preview chunks and wire up lazy special-block rendering
import type { RefObject } from 'react';

import type { MarkdownPreviewChunk, MarkdownSpecialBlock } from '../../../lib/markdownPreview';
import { useSpecialCodeBlockPreview } from '../useSpecialCodeBlockPreview';

export interface MarkdownPreviewProps {
  chunks: MarkdownPreviewChunk[];
  specialBlocks: MarkdownSpecialBlock[];
  hasContent: boolean;
  isProgressiveRendering: boolean;
  isRendering: boolean;
  errorMessage: string;
  previewContainerRef: RefObject<HTMLDivElement>;
}

export function MarkdownPreview({
  chunks,
  specialBlocks,
  hasContent,
  isProgressiveRendering,
  isRendering,
  errorMessage,
  previewContainerRef,
}: MarkdownPreviewProps) {
  useSpecialCodeBlockPreview({
    previewContainerRef,
    specialBlocks,
  });

  if (!hasContent) {
    return (
      <div className="flex min-h-[62vh] items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-6 py-10 text-center">
        <p className="max-w-sm text-sm leading-7 text-[var(--color-text-secondary)]">
          {'\u5f00\u59cb\u8f93\u5165 Markdown \u5185\u5bb9\u540e\uff0c\u8fd9\u91cc\u4f1a\u5b9e\u65f6\u663e\u793a\u9884\u89c8\u7ed3\u679c\u3002'}
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

  if (isRendering && chunks.length === 0) {
    return (
      <div className="flex min-h-[62vh] items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-6 py-10 text-center">
        <p className="max-w-sm text-sm leading-7 text-[var(--color-text-secondary)]">
          {'\u6b63\u5728\u751f\u6210\u9884\u89c8\uff0c\u8bf7\u7a0d\u5019...'}
        </p>
      </div>
    );
  }

  const statusMessage = isProgressiveRendering
    ? '\u5927\u6587\u6863\u9884\u89c8\u6b63\u5728\u5206\u5757\u8865\u9f50\uff0c\u9996\u5c4f\u5185\u5bb9\u4f1a\u4f18\u5148\u663e\u793a\u3002'
    : isRendering
      ? '\u9884\u89c8\u5df2\u542f\u7528\u9632\u6296\uff0c\u505c\u6b62\u8f93\u5165\u540e\u4f1a\u5237\u65b0\u5230\u6700\u65b0\u5185\u5bb9\u3002'
      : '';

  return (
    <div
      className="min-h-[62vh] overflow-auto rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)]"
      ref={previewContainerRef}
    >
      {statusMessage ? (
        <div className="border-b border-[var(--color-border-soft)] bg-[rgba(20,20,19,0.03)] px-5 py-3 text-xs leading-6 text-[var(--color-text-secondary)]">
          {statusMessage}
        </div>
      ) : null}
      <div className="markdown-preview px-5 py-4">
        {chunks.map((chunk) => (
          <article
            className="markdown-preview-chunk"
            dangerouslySetInnerHTML={{ __html: chunk.html }}
            key={chunk.id}
          />
        ))}
      </div>
    </div>
  );
}
