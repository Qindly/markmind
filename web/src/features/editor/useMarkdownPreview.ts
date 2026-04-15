// useMarkdownPreview.ts - debounce expensive preview rendering via Web Worker
import { startTransition, useEffect, useRef, useState } from 'react';

import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { MarkdownPreviewResult } from '../../lib/markdownPreview';
import {
  cancelWorkerRequest,
  renderMarkdownInWorker,
} from '../../lib/markdown/markdownPreviewWorkerClient';

const PREVIEW_RENDER_DEBOUNCE_MS = 180;
const LARGE_DOCUMENT_CHAR_THRESHOLD = 50_000;
const LARGE_DOCUMENT_DEBOUNCE_MS = 500;
const MAX_PREVIEW_CHAR_LIMIT = 500_000;

/** 根据文档大小动态选择防抖时长，大文档用更长的防抖避免频繁渲染 */
function getAdaptiveDebounceMs(contentLength: number): number {
  return contentLength >= LARGE_DOCUMENT_CHAR_THRESHOLD
    ? LARGE_DOCUMENT_DEBOUNCE_MS
    : PREVIEW_RENDER_DEBOUNCE_MS;
}

export interface UseMarkdownPreviewResult extends MarkdownPreviewResult {
  hasContent: boolean;
  isRendering: boolean;
  isDebouncing: boolean;
  errorMessage: string;
}

const EMPTY_PREVIEW_RESULT: MarkdownPreviewResult = {
  html: '',
  headings: [],
  specialBlocks: [],
  chunks: [],
  isChunked: false,
};

function getMarkdownPreviewErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return `\u9884\u89c8\u751f\u6210\u5931\u8d25\uff1a${error.message.trim()}`;
  }

  return '\u9884\u89c8\u751f\u6210\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u5f53\u524d Markdown \u5185\u5bb9\u662f\u5426\u5b58\u5728\u5f02\u5e38\u3002';
}

export function useMarkdownPreview(content: string): UseMarkdownPreviewResult {
  const hasContent = Boolean(content.trim());
  const adaptiveDebounceMs = getAdaptiveDebounceMs(content.length);
  const debouncedContent = useDebouncedValue(content, adaptiveDebounceMs);
  const isDebouncing = hasContent && content !== debouncedContent;
  const requestIDRef = useRef(0);
  const [previewState, setPreviewState] = useState<UseMarkdownPreviewResult>({
    ...EMPTY_PREVIEW_RESULT,
    hasContent: false,
    isRendering: false,
    isDebouncing: false,
    errorMessage: '',
  });

  useEffect(() => {
    if (!hasContent) {
      setPreviewState({
        ...EMPTY_PREVIEW_RESULT,
        hasContent: false,
        isRendering: false,
        isDebouncing: false,
        errorMessage: '',
      });
      return;
    }

    let isDisposed = false;
    requestIDRef.current += 1;
    const currentRequestID = requestIDRef.current;

    startTransition(() => {
      setPreviewState((currentState) => ({
        ...currentState,
        hasContent: true,
        isRendering: true,
        isDebouncing: false,
        errorMessage: '',
      }));
    });

    // 超大文档保护：超过上限时只渲染前 N 个字符，避免 Worker 卡死
    let markdownToRender = debouncedContent;
    if (debouncedContent.length > MAX_PREVIEW_CHAR_LIMIT) {
      const truncatePoint = debouncedContent.lastIndexOf('\n', MAX_PREVIEW_CHAR_LIMIT);
      markdownToRender = debouncedContent.slice(0, truncatePoint > 0 ? truncatePoint : MAX_PREVIEW_CHAR_LIMIT)
        + '\n\n---\n\n> ⚠️ 文档内容过长，预览仅显示前 50 万字符。';
    }

    const { promise, id: workerRequestId } = renderMarkdownInWorker(markdownToRender);

    void promise
      .then((nextPreview) => {
        if (isDisposed || requestIDRef.current !== currentRequestID) {
          return;
        }

        startTransition(() => {
          setPreviewState({
            ...nextPreview,
            hasContent: true,
            isRendering: false,
            isDebouncing: false,
            errorMessage: '',
          });
        });
      })
      .catch((error) => {
        if (isDisposed || requestIDRef.current !== currentRequestID) {
          return;
        }

        startTransition(() => {
          setPreviewState({
            ...EMPTY_PREVIEW_RESULT,
            hasContent: true,
            isRendering: false,
            isDebouncing: false,
            errorMessage: getMarkdownPreviewErrorMessage(error),
          });
        });
      });

    return () => {
      isDisposed = true;
      cancelWorkerRequest(workerRequestId);
    };
  }, [debouncedContent, hasContent]);

  return {
    ...previewState,
    hasContent,
    isRendering: previewState.isRendering || isDebouncing,
    isDebouncing,
    errorMessage: isDebouncing ? '' : previewState.errorMessage,
  };
}
