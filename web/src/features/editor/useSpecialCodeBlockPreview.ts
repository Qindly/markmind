// useSpecialCodeBlockPreview.ts - 统一分发并增强预览区中的 Mermaid、ECharts 等特殊代码块
import { useEffect, type RefObject } from 'react';

import { getSpecialCodeBlockRenderer } from './specialCodeBlockRenderers';

const CODE_BLOCK_SELECTOR = 'pre > code';

export interface UseSpecialCodeBlockPreviewOptions {
  html: string;
  previewContainerRef: RefObject<HTMLDivElement>;
}

// resolveCodeBlockLanguage - 从代码块 class 中提取 language 前缀对应的语言名称。
// 参数 codeBlockElement: 当前代码块元素。
// 返回值：标准化后的语言名，未命中时返回空字符串。
function resolveCodeBlockLanguage(codeBlockElement: HTMLElement): string {
  const languageClassName = Array.from(codeBlockElement.classList).find((className) =>
    className.startsWith('language-'),
  );

  return languageClassName?.replace(/^language-/, '').toLowerCase() ?? '';
}

// createSpecialBlockElement - 创建特殊代码块渲染成功后的外层容器和视口节点。
// 参数 language: 当前渲染器对应的语言名。
// 返回值：用于承载渲染结果的块级容器与内部视口节点。
function createSpecialBlockElement(language: string) {
  const blockElement = document.createElement('div');
  blockElement.className = `markmind-special-block markmind-special-block-${language}`;

  const viewportElement = document.createElement('div');
  viewportElement.className = `markmind-special-viewport markmind-special-viewport-${language}`;
  blockElement.appendChild(viewportElement);

  return {
    blockElement,
    viewportElement,
  };
}

// createSpecialBlockErrorNotice - 构造特殊代码块渲染失败提示节点。
// 参数 displayName: 当前渲染器对应的展示名称。
// 参数 message: 需要展示给用户的错误信息。
// 返回值：插入到预览区中的错误提示节点。
function createSpecialBlockErrorNotice(displayName: string, message: string): HTMLDivElement {
  const errorElement = document.createElement('div');
  errorElement.className = 'markmind-special-error';
  errorElement.textContent = `${displayName} 渲染失败：${message}`;

  return errorElement;
}

/**
 * useSpecialCodeBlockPreview - 扫描预览区代码块并分发给已注册的特殊渲染器。
 * 参数 options: 当前预览 HTML 与预览容器引用。
 * 返回值：无，副作用为原地增强预览区 DOM。
 */
export function useSpecialCodeBlockPreview({
  html,
  previewContainerRef,
}: UseSpecialCodeBlockPreviewOptions) {
  useEffect(() => {
    const previewContainer = previewContainerRef.current;
    if (!previewContainer || !html) {
      return;
    }

    const codeBlockElements = Array.from(
      previewContainer.querySelectorAll<HTMLElement>(CODE_BLOCK_SELECTOR),
    );
    if (codeBlockElements.length === 0) {
      return;
    }

    let isDisposed = false;
    const cleanupList: Array<() => void> = [];

    async function enhanceCodeBlock(codeBlockElement: HTMLElement) {
      const language = resolveCodeBlockLanguage(codeBlockElement);
      const renderer = getSpecialCodeBlockRenderer(language);
      if (!renderer) {
        return;
      }

      const preElement = codeBlockElement.closest('pre');
      const source = codeBlockElement.textContent?.trim() ?? '';
      if (!preElement) {
        return;
      }

      if (!source) {
        preElement.classList.add('markmind-special-fallback');
        preElement.before(createSpecialBlockErrorNotice(renderer.displayName, renderer.emptyMessage));
        return;
      }

      try {
        const { blockElement, viewportElement } = createSpecialBlockElement(language);
        const cleanup = await renderer.render({
          source,
          viewportElement,
        });

        if (isDisposed || !preElement.isConnected) {
          cleanup?.();
          return;
        }

        preElement.replaceWith(blockElement);
        if (cleanup) {
          cleanupList.push(cleanup);
        }
      } catch (error) {
        if (isDisposed || !preElement.isConnected) {
          return;
        }

        preElement.classList.add('markmind-special-fallback');
        preElement.before(
          createSpecialBlockErrorNotice(renderer.displayName, renderer.getErrorMessage(error)),
        );
      }
    }

    void Promise.all(codeBlockElements.map((codeBlockElement) => enhanceCodeBlock(codeBlockElement)));

    return () => {
      isDisposed = true;
      cleanupList.forEach((cleanup) => {
        cleanup();
      });
    };
  }, [html, previewContainerRef]);
}
