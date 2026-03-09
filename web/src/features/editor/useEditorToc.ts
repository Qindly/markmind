// useEditorToc.ts - 管理编辑页 TOC、页面滚动高亮与 URL hash 同步
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { renderMarkdownPreview } from '../../lib/markdownPreview';
import { buildEditorTocTree, type EditorTocNode } from './buildEditorTocTree';

const PREVIEW_HEADING_SELECTOR = 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]';
const ACTIVE_HEADING_TOP_OFFSET = 144;
const SCROLL_TARGET_TOP_OFFSET = 16;

export interface UseEditorTocResult {
  previewHtml: string;
  hasPreviewContent: boolean;
  tocTree: EditorTocNode[];
  activeHeadingId: string | null;
  expandedState: Record<string, boolean>;
  previewContainerRef: RefObject<HTMLDivElement>;
  handleSelectHeading: (id: string) => void;
  handleToggleHeading: (id: string) => void;
}

interface SetActiveHeadingOptions {
  syncHash?: boolean;
  expandAncestors?: boolean;
}

// getCurrentHashHeadingId - 读取当前浏览器地址中的标题 hash。
// 返回值：去掉 # 并解码后的标题 ID。
function getCurrentHashHeadingId(): string {
  const rawHash = window.location.hash.replace(/^#/, '');
  if (!rawHash) {
    return '';
  }

  try {
    return decodeURIComponent(rawHash);
  } catch {
    return rawHash;
  }
}

// replaceHeadingHash - 使用 replaceState 同步当前标题 hash。
// 参数 headingId: 需要写入地址栏的标题 ID，为 null 时清空 hash。
function replaceHeadingHash(headingId: string | null) {
  const nextHash = headingId ? `#${encodeURIComponent(headingId)}` : '';
  if (window.location.hash === nextHash) {
    return;
  }

  const url = new URL(window.location.href);
  url.hash = headingId ? encodeURIComponent(headingId) : '';
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

// getPreviewHeadingElements - 获取当前预览容器中的所有标题元素。
// 参数 container: 预览容器。
// 返回值：带锚点 ID 的标题元素数组。
function getPreviewHeadingElements(container: HTMLDivElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(PREVIEW_HEADING_SELECTOR));
}

// resolveViewportActiveHeadingId - 根据当前窗口滚动位置推导激活标题。
// 参数 headingElements: 预览中的所有标题元素。
// 返回值：当前应高亮的标题 ID。
function resolveViewportActiveHeadingId(headingElements: HTMLElement[]): string | null {
  if (headingElements.length === 0) {
    return null;
  }

  let activeHeadingId = headingElements[0].id;

  headingElements.forEach((heading) => {
    if (heading.getBoundingClientRect().top <= ACTIVE_HEADING_TOP_OFFSET) {
      activeHeadingId = heading.id;
    }
  });

  return activeHeadingId;
}

/**
 * useEditorToc - 负责目录树生成、折叠状态、滚动高亮与 hash 同步。
 * 参数 content: 当前编辑器中的 Markdown 正文。
 * 返回值：预览 HTML、TOC 树、激活标题、折叠状态与交互回调。
 */
export function useEditorToc(content: string): UseEditorTocResult {
  const preview = useMemo(() => {
    if (!content.trim()) {
      return {
        html: '',
        headings: [],
      };
    }

    return renderMarkdownPreview(content);
  }, [content]);

  const headingIdKey = useMemo(
    () => preview.headings.map((heading) => heading.id).join('|'),
    [preview.headings],
  );

  const headingIdSet = useMemo(
    () => new Set(preview.headings.map((heading) => heading.id)),
    [preview.headings],
  );

  const { tree: tocTree, ancestorMap, expandableIds } = useMemo(
    () => buildEditorTocTree(preview.headings),
    [preview.headings],
  );

  const expandableIdKey = useMemo(() => expandableIds.join('|'), [expandableIds]);

  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const lastAppliedHashSignatureRef = useRef('');

  const expandAncestorChain = useCallback(
    (headingId: string) => {
      const ancestorIds = ancestorMap[headingId] ?? [];
      if (ancestorIds.length === 0) {
        return;
      }

      setExpandedState((currentState) => {
        let didChange = false;
        const nextState = { ...currentState };

        ancestorIds.forEach((ancestorId) => {
          if (nextState[ancestorId] !== true) {
            nextState[ancestorId] = true;
            didChange = true;
          }
        });

        return didChange ? nextState : currentState;
      });
    },
    [ancestorMap],
  );

  const setActiveHeading = useCallback(
    (headingId: string | null, options: SetActiveHeadingOptions = {}) => {
      const { syncHash = true, expandAncestors = true } = options;

      if (!headingId) {
        setActiveHeadingId(null);
        if (syncHash) {
          replaceHeadingHash(null);
        }
        return;
      }

      if (expandAncestors) {
        expandAncestorChain(headingId);
      }

      setActiveHeadingId((currentHeadingId) =>
        currentHeadingId === headingId ? currentHeadingId : headingId,
      );

      if (syncHash) {
        replaceHeadingHash(headingId);
      }
    },
    [expandAncestorChain],
  );

  const scrollToHeading = useCallback((headingId: string, smooth: boolean) => {
    const targetHeading = getPreviewHeadingElements(previewContainerRef.current).find(
      (heading) => heading.id === headingId,
    );
    if (!targetHeading) {
      return false;
    }

    const targetTop = window.scrollY + targetHeading.getBoundingClientRect().top - SCROLL_TARGET_TOP_OFFSET;
    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: smooth ? 'smooth' : 'auto',
    });

    return true;
  }, []);

  const handleSelectHeading = useCallback(
    (headingId: string) => {
      if (!scrollToHeading(headingId, true)) {
        return;
      }

      lastAppliedHashSignatureRef.current = `${headingIdKey}::${headingId}`;
      setActiveHeading(headingId);
    },
    [headingIdKey, scrollToHeading, setActiveHeading],
  );

  const handleToggleHeading = useCallback(
    (headingId: string) => {
      setExpandedState((currentState) => ({
        ...currentState,
        [headingId]: currentState[headingId] === false,
      }));

      if (activeHeadingId && (ancestorMap[activeHeadingId] ?? []).includes(headingId)) {
        setActiveHeading(headingId);
      }
    },
    [activeHeadingId, ancestorMap, setActiveHeading],
  );

  useEffect(() => {
    setExpandedState((currentState) => {
      const nextState: Record<string, boolean> = {};
      let didChange = Object.keys(currentState).length !== expandableIds.length;

      expandableIds.forEach((headingId) => {
        nextState[headingId] = currentState[headingId] ?? true;
        if (nextState[headingId] !== currentState[headingId]) {
          didChange = true;
        }
      });

      return didChange ? nextState : currentState;
    });
  }, [expandableIdKey, expandableIds]);

  useEffect(() => {
    if (preview.headings.length === 0) {
      lastAppliedHashSignatureRef.current = '';
      setActiveHeading(null, { syncHash: false });
      return;
    }

    const hashHeadingId = getCurrentHashHeadingId();
    const hasHashHeading = Boolean(hashHeadingId) && headingIdSet.has(hashHeadingId);
    const hasActiveHeading = activeHeadingId ? headingIdSet.has(activeHeadingId) : false;

    const nextActiveHeadingId = hasActiveHeading
      ? activeHeadingId
      : hasHashHeading
        ? hashHeadingId
        : preview.headings[0].id;

    setActiveHeading(nextActiveHeadingId, {
      syncHash: !hasHashHeading,
      expandAncestors: true,
    });
  }, [activeHeadingId, headingIdKey, headingIdSet, preview.headings, setActiveHeading]);

  useEffect(() => {
    if (preview.headings.length === 0) {
      return;
    }

    const hashHeadingId = getCurrentHashHeadingId();
    if (!hashHeadingId || !headingIdSet.has(hashHeadingId)) {
      return;
    }

    const signature = `${headingIdKey}::${hashHeadingId}`;
    if (lastAppliedHashSignatureRef.current === signature) {
      return;
    }

    if (scrollToHeading(hashHeadingId, false)) {
      lastAppliedHashSignatureRef.current = signature;
      setActiveHeading(hashHeadingId, {
        syncHash: false,
        expandAncestors: true,
      });
    }
  }, [headingIdKey, headingIdSet, preview.html, preview.headings.length, scrollToHeading, setActiveHeading]);

  useEffect(() => {
    if (preview.headings.length === 0) {
      return undefined;
    }

    function handleHashChange() {
      const hashHeadingId = getCurrentHashHeadingId();
      if (!hashHeadingId || !headingIdSet.has(hashHeadingId)) {
        return;
      }

      if (scrollToHeading(hashHeadingId, false)) {
        lastAppliedHashSignatureRef.current = `${headingIdKey}::${hashHeadingId}`;
      }

      setActiveHeading(hashHeadingId, {
        syncHash: false,
        expandAncestors: true,
      });
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [headingIdKey, headingIdSet, preview.headings.length, scrollToHeading, setActiveHeading]);

  useEffect(() => {
    if (preview.headings.length === 0) {
      return undefined;
    }

    const headingElements = getPreviewHeadingElements(previewContainerRef.current);
    if (headingElements.length === 0) {
      return undefined;
    }

    let rafID = 0;

    function syncActiveHeadingFromViewport() {
      if (rafID) {
        cancelAnimationFrame(rafID);
      }

      rafID = window.requestAnimationFrame(() => {
        const nextActiveHeadingId = resolveViewportActiveHeadingId(headingElements);
        setActiveHeading(nextActiveHeadingId);
      });
    }

    syncActiveHeadingFromViewport();
    window.addEventListener('scroll', syncActiveHeadingFromViewport, { passive: true });
    window.addEventListener('resize', syncActiveHeadingFromViewport);

    return () => {
      if (rafID) {
        cancelAnimationFrame(rafID);
      }
      window.removeEventListener('scroll', syncActiveHeadingFromViewport);
      window.removeEventListener('resize', syncActiveHeadingFromViewport);
    };
  }, [headingIdKey, preview.html, preview.headings.length, setActiveHeading]);

  return {
    previewHtml: preview.html,
    hasPreviewContent: Boolean(content.trim()),
    tocTree,
    activeHeadingId,
    expandedState,
    previewContainerRef,
    handleSelectHeading,
    handleToggleHeading,
  };
}
