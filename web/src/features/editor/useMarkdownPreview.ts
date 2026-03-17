// useMarkdownPreview.ts - debounce expensive preview rendering and keep async state in sync
import { startTransition, useEffect, useRef, useState } from 'react';

import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { MarkdownPreviewResult } from '../../lib/markdownPreview';

type MarkdownPreviewModule = typeof import('../../lib/markdownPreview');

const PREVIEW_RENDER_DEBOUNCE_MS = 180;
let markdownPreviewModulePromise: Promise<MarkdownPreviewModule> | null = null;

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

async function getMarkdownPreviewModule(): Promise<MarkdownPreviewModule> {
  if (!markdownPreviewModulePromise) {
    markdownPreviewModulePromise = import('../../lib/markdownPreview');
  }

  return markdownPreviewModulePromise;
}

function getMarkdownPreviewErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return `\u9884\u89c8\u751f\u6210\u5931\u8d25\uff1a${error.message.trim()}`;
  }

  return '\u9884\u89c8\u751f\u6210\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u5f53\u524d Markdown \u5185\u5bb9\u662f\u5426\u5b58\u5728\u5f02\u5e38\u3002';
}

export function useMarkdownPreview(content: string): UseMarkdownPreviewResult {
  const hasContent = Boolean(content.trim());
  const debouncedContent = useDebouncedValue(content, PREVIEW_RENDER_DEBOUNCE_MS);
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

    void (async () => {
      try {
        const markdownPreviewModule = await getMarkdownPreviewModule();
        const nextPreview = markdownPreviewModule.renderMarkdownPreview(debouncedContent);
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
      } catch (error) {
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
      }
    })();

    return () => {
      isDisposed = true;
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
