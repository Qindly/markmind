// useSpecialCodeBlockPreview.ts - lazily render special preview blocks when they approach the viewport
import { useEffect, type RefObject } from 'react';

import type { MarkdownSpecialBlock } from '../../lib/markdownPreview';
import { getSpecialCodeBlockRenderer } from './specialCodeBlockRenderers';

const SPECIAL_BLOCK_SELECTOR = '[data-special-block="true"]';
const SPECIAL_VIEWPORT_SELECTOR = '[data-special-viewport="true"]';
const SPECIAL_BLOCK_ROOT_MARGIN = '240px 0px 240px 0px';

export interface UseSpecialCodeBlockPreviewOptions {
  previewContainerRef: RefObject<HTMLDivElement>;
  specialBlocks: MarkdownSpecialBlock[];
}

function getSpecialBlockID(blockElement: HTMLElement): string {
  return blockElement.dataset.blockId ?? '';
}

function createSpecialBlockViewportElement(language: string) {
  const viewportElement = document.createElement('div');
  viewportElement.className = `markmind-special-viewport markmind-special-viewport-${language}`;
  viewportElement.dataset.specialViewport = 'true';
  return viewportElement;
}

function createSpecialBlockNoticeElement(className: string, message: string) {
  const noticeElement = document.createElement('div');
  noticeElement.className = className;
  noticeElement.textContent = message;
  return noticeElement;
}

function ensureSpecialBlockViewport(blockElement: HTMLElement, language: string): HTMLDivElement {
  const existingViewport = blockElement.querySelector<HTMLDivElement>(SPECIAL_VIEWPORT_SELECTOR);
  if (existingViewport) {
    return existingViewport;
  }

  const viewportElement = createSpecialBlockViewportElement(language);
  blockElement.replaceChildren(viewportElement);
  return viewportElement;
}

function setSpecialBlockIdleState(viewportElement: HTMLDivElement, message: string) {
  viewportElement.replaceChildren(createSpecialBlockNoticeElement('markmind-special-loading', message));
}

function setSpecialBlockLoadingState(viewportElement: HTMLDivElement, message: string) {
  viewportElement.replaceChildren(createSpecialBlockNoticeElement('markmind-special-loading', message));
}

function setSpecialBlockErrorState(
  viewportElement: HTMLDivElement,
  displayName: string,
  message: string,
) {
  viewportElement.replaceChildren(
    createSpecialBlockNoticeElement('markmind-special-error', `${displayName} 渲染失败：${message}`),
  );
}

export function useSpecialCodeBlockPreview({
  previewContainerRef,
  specialBlocks,
}: UseSpecialCodeBlockPreviewOptions) {
  useEffect(() => {
    const previewContainer = previewContainerRef.current;
    if (!previewContainer || specialBlocks.length === 0) {
      return;
    }

    const specialBlockMap = new Map(specialBlocks.map((specialBlock) => [specialBlock.id, specialBlock]));
    let isDisposed = false;
    const cleanupMap = new Map<string, () => void>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const blockElement = entry.target as HTMLElement;
          const blockID = getSpecialBlockID(blockElement);
          const specialBlock = specialBlockMap.get(blockID);
          if (!blockID || !specialBlock) {
            observer.unobserve(blockElement);
            return;
          }

          const renderer = getSpecialCodeBlockRenderer(specialBlock.language);
          if (!renderer) {
            observer.unobserve(blockElement);
            return;
          }

          const viewportElement = ensureSpecialBlockViewport(blockElement, renderer.language);
          if (!specialBlock.code.trim()) {
            blockElement.dataset.renderState = 'error';
            setSpecialBlockErrorState(viewportElement, renderer.displayName, renderer.emptyMessage);
            observer.unobserve(blockElement);
            return;
          }

          if (blockElement.dataset.renderState === 'loading' || blockElement.dataset.renderState === 'success') {
            observer.unobserve(blockElement);
            return;
          }

          blockElement.dataset.renderState = 'loading';
          setSpecialBlockLoadingState(viewportElement, renderer.loadingMessage);
          observer.unobserve(blockElement);

          void (async () => {
            try {
              const loadedRenderer = await renderer.load();
              if (isDisposed || !blockElement.isConnected) {
                return;
              }

              const cleanup = await loadedRenderer.render({
                source: specialBlock.code,
                viewportElement,
              });

              if (isDisposed || !blockElement.isConnected) {
                cleanup?.();
                return;
              }

              blockElement.dataset.renderState = 'success';
              if (cleanup) {
                cleanupMap.set(blockID, cleanup);
              }
            } catch (error) {
              if (isDisposed || !blockElement.isConnected) {
                return;
              }

              blockElement.dataset.renderState = 'error';
              setSpecialBlockErrorState(viewportElement, renderer.displayName, renderer.getErrorMessage(error));
            }
          })();
        });
      },
      {
        root: null,
        rootMargin: SPECIAL_BLOCK_ROOT_MARGIN,
        threshold: 0.01,
      },
    );

    const hydrateSpecialBlockElement = (blockElement: HTMLElement) => {
      const blockID = getSpecialBlockID(blockElement);
      if (!blockID || cleanupMap.has(blockID)) {
        return;
      }

      const specialBlock = specialBlockMap.get(blockID);
      if (!specialBlock) {
        return;
      }

      const renderer = getSpecialCodeBlockRenderer(specialBlock.language);
      if (!renderer) {
        return;
      }

      const viewportElement = ensureSpecialBlockViewport(blockElement, renderer.language);
      if (!specialBlock.code.trim()) {
        blockElement.dataset.renderState = 'error';
        setSpecialBlockErrorState(viewportElement, renderer.displayName, renderer.emptyMessage);
        return;
      }

      if (blockElement.dataset.renderState === 'success' || blockElement.dataset.renderState === 'loading') {
        return;
      }

      blockElement.dataset.renderState = 'idle';
      setSpecialBlockIdleState(viewportElement, renderer.idleMessage);
      observer.observe(blockElement);
    };

    const mutationObserver = new MutationObserver((mutationList) => {
      mutationList.forEach((mutation) => {
        mutation.addedNodes.forEach((addedNode) => {
          if (!(addedNode instanceof HTMLElement)) {
            return;
          }

          if (addedNode.matches(SPECIAL_BLOCK_SELECTOR)) {
            hydrateSpecialBlockElement(addedNode);
          }

          addedNode.querySelectorAll<HTMLElement>(SPECIAL_BLOCK_SELECTOR).forEach((blockElement) => {
            hydrateSpecialBlockElement(blockElement);
          });
        });
      });
    });

    previewContainer.querySelectorAll<HTMLElement>(SPECIAL_BLOCK_SELECTOR).forEach((blockElement) => {
      hydrateSpecialBlockElement(blockElement);
    });

    mutationObserver.observe(previewContainer, {
      childList: true,
      subtree: true,
    });

    return () => {
      isDisposed = true;
      mutationObserver.disconnect();
      observer.disconnect();
      cleanupMap.forEach((cleanup) => {
        cleanup();
      });
    };
  }, [previewContainerRef, specialBlocks]);
}
