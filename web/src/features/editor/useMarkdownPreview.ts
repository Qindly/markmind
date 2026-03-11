// useMarkdownPreview.ts - 按需加载 Markdown 预览渲染链并返回异步预览结果
import { useEffect, useRef, useState } from 'react';

import type { MarkdownPreviewResult } from '../../lib/markdownPreview';

type MarkdownPreviewModule = typeof import('../../lib/markdownPreview');

let markdownPreviewModulePromise: Promise<MarkdownPreviewModule> | null = null;

export interface UseMarkdownPreviewResult extends MarkdownPreviewResult {
  hasContent: boolean;
  isRendering: boolean;
  errorMessage: string;
}

const EMPTY_PREVIEW_RESULT: MarkdownPreviewResult = {
  html: '',
  headings: [],
};

// getMarkdownPreviewModule - 懒加载 Markdown 预览渲染模块。
// 返回值：包含 renderMarkdownPreview 的运行时模块对象。
async function getMarkdownPreviewModule(): Promise<MarkdownPreviewModule> {
  if (!markdownPreviewModulePromise) {
    markdownPreviewModulePromise = import('../../lib/markdownPreview');
  }

  return markdownPreviewModulePromise;
}

// getMarkdownPreviewErrorMessage - 整理预览渲染失败时的展示文案。
// 参数 error: 渲染阶段抛出的异常对象。
// 返回值：适合直接展示在预览区中的错误提示。
function getMarkdownPreviewErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return `预览生成失败：${error.message.trim()}`;
  }

  return '预览生成失败，请检查当前 Markdown 内容是否存在异常。';
}

/**
 * useMarkdownPreview - 按需生成 Markdown 预览结果与标题数据。
 * 参数 content: 当前编辑器中的 Markdown 正文。
 * 返回值：预览 HTML、标题列表、加载状态与错误信息。
 */
export function useMarkdownPreview(content: string): UseMarkdownPreviewResult {
  const hasContent = Boolean(content.trim());
  const requestIDRef = useRef(0);
  const [previewState, setPreviewState] = useState<UseMarkdownPreviewResult>({
    ...EMPTY_PREVIEW_RESULT,
    hasContent: false,
    isRendering: false,
    errorMessage: '',
  });

  useEffect(() => {
    if (!hasContent) {
      setPreviewState({
        ...EMPTY_PREVIEW_RESULT,
        hasContent: false,
        isRendering: false,
        errorMessage: '',
      });
      return;
    }

    let isDisposed = false;
    requestIDRef.current += 1;
    const currentRequestID = requestIDRef.current;

    setPreviewState((currentState) => ({
      ...currentState,
      hasContent: true,
      isRendering: true,
      errorMessage: '',
    }));

    void (async () => {
      try {
        const markdownPreviewModule = await getMarkdownPreviewModule();
        const nextPreview = markdownPreviewModule.renderMarkdownPreview(content);
        if (isDisposed || requestIDRef.current !== currentRequestID) {
          return;
        }

        setPreviewState({
          ...nextPreview,
          hasContent: true,
          isRendering: false,
          errorMessage: '',
        });
      } catch (error) {
        if (isDisposed || requestIDRef.current !== currentRequestID) {
          return;
        }

        setPreviewState({
          ...EMPTY_PREVIEW_RESULT,
          hasContent: true,
          isRendering: false,
          errorMessage: getMarkdownPreviewErrorMessage(error),
        });
      }
    })();

    return () => {
      isDisposed = true;
    };
  }, [content, hasContent]);

  return previewState;
}
