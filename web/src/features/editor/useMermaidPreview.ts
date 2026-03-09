// useMermaidPreview.ts - 负责将预览区中的 Mermaid 代码块增强为图表渲染结果
import { useEffect, type RefObject } from 'react';

import { renderMermaidSvg } from '../../lib/mermaid';

const MERMAID_CODE_SELECTOR = 'pre > code.language-mermaid';

export interface UseMermaidPreviewOptions {
  html: string;
  previewContainerRef: RefObject<HTMLDivElement>;
}

// getMermaidErrorMessage - 统一整理 Mermaid 渲染失败时的提示文案。
// 参数 error: Mermaid 运行时抛出的异常对象。
// 返回值：适合直接展示给用户的错误信息。
function getMermaidErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return '请检查当前 Mermaid 语法是否完整。';
}

// createMermaidDiagramElement - 为渲染成功的图表构造替换节点。
// 参数 svg: Mermaid 返回的 SVG 字符串。
// 返回值：用于替换原始代码块的容器节点。
function createMermaidDiagramElement(svg: string): HTMLDivElement {
  const blockElement = document.createElement('div');
  blockElement.className = 'markmind-mermaid-block';

  const viewportElement = document.createElement('div');
  viewportElement.className = 'markmind-mermaid-viewport';
  viewportElement.innerHTML = svg;

  blockElement.appendChild(viewportElement);
  return blockElement;
}

// createMermaidErrorNotice - 构造 Mermaid 渲染失败提示节点。
// 参数 message: 需要展示的错误信息。
// 返回值：插入到预览区中的错误提示节点。
function createMermaidErrorNotice(message: string): HTMLDivElement {
  const errorElement = document.createElement('div');
  errorElement.className = 'markmind-mermaid-error';
  errorElement.textContent = `Mermaid 渲染失败：${message}`;

  return errorElement;
}

/**
 * useMermaidPreview - 扫描预览区内的 Mermaid 代码块并在客户端替换为图表。
 * 参数 options: 当前预览 HTML 与预览容器引用。
 * 返回值：无，副作用为原地增强预览区 DOM。
 */
export function useMermaidPreview({
  html,
  previewContainerRef,
}: UseMermaidPreviewOptions) {
  useEffect(() => {
    const previewContainer = previewContainerRef.current;
    if (!previewContainer || !html) {
      return;
    }

    const mermaidCodeBlocks = Array.from(
      previewContainer.querySelectorAll<HTMLElement>(MERMAID_CODE_SELECTOR),
    );
    if (mermaidCodeBlocks.length === 0) {
      return;
    }

    let isDisposed = false;

    async function enhanceMermaidBlock(codeBlockElement: HTMLElement) {
      const preElement = codeBlockElement.closest('pre');
      const source = codeBlockElement.textContent?.trim();
      if (!preElement || !source) {
        return;
      }

      try {
        const svg = await renderMermaidSvg(source);
        if (isDisposed || !preElement.isConnected) {
          return;
        }

        preElement.replaceWith(createMermaidDiagramElement(svg));
      } catch (error) {
        if (isDisposed || !preElement.isConnected) {
          return;
        }

        preElement.classList.add('markmind-mermaid-fallback');
        preElement.before(createMermaidErrorNotice(getMermaidErrorMessage(error)));
      }
    }

    void Promise.all(mermaidCodeBlocks.map((codeBlockElement) => enhanceMermaidBlock(codeBlockElement)));

    return () => {
      isDisposed = true;
    };
  }, [html, previewContainerRef]);
}
