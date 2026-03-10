// useVirtualListWindow.ts - 管理首页列表滚动容器的虚拟窗口计算
import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';

const DEFAULT_VISIBLE_ROW_COUNT = 8;

export interface UseVirtualListWindowOptions {
  enabled: boolean;
  itemCount: number;
  rowHeight: number;
  overscan?: number;
}

export interface VirtualListWindowState {
  containerRef: RefObject<HTMLDivElement>;
  startIndex: number;
  endIndex: number;
}

/**
 * useVirtualListWindow - 根据滚动位置计算需要渲染的可见区间。
 * 参数 options: 是否启用、条目总数、单行高度与预渲染数量。
 * 返回值：滚动容器 ref 与当前可见区间。
 */
export function useVirtualListWindow({
  enabled,
  itemCount,
  rowHeight,
  overscan = 4,
}: UseVirtualListWindowOptions): VirtualListWindowState {
  const containerRef = useRef<HTMLDivElement>(null!);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) {
      setScrollTop(0);
      setViewportHeight(0);
      return;
    }

    function syncViewportState(target: HTMLDivElement) {
      setScrollTop(target.scrollTop);
      setViewportHeight(target.clientHeight);
    }

    function handleScroll() {
      setScrollTop(container.scrollTop);
    }

    syncViewportState(container);
    container.addEventListener('scroll', handleScroll, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        setViewportHeight(container.clientHeight);
      });
      resizeObserver.observe(container);
    } else {
      const handleResize = () => syncViewportState(container);
      window.addEventListener('resize', handleResize);

      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver?.disconnect();
    };
  }, [enabled, itemCount]);

  const [startIndex, endIndex] = useMemo(() => {
    if (!enabled) {
      return [0, itemCount];
    }

    const visibleRowCount =
      viewportHeight > 0 ? Math.max(1, Math.ceil(viewportHeight / rowHeight)) : DEFAULT_VISIBLE_ROW_COUNT;
    const firstVisibleIndex = Math.max(0, Math.floor(scrollTop / rowHeight));
    const maxStartIndex = Math.max(0, itemCount - visibleRowCount);
    const nextStartIndex = Math.min(maxStartIndex, Math.max(0, firstVisibleIndex - overscan));
    const nextEndIndex = Math.min(itemCount, nextStartIndex + visibleRowCount + overscan * 2);

    return [nextStartIndex, nextEndIndex];
  }, [enabled, itemCount, overscan, rowHeight, scrollTop, viewportHeight]);

  return {
    containerRef,
    startIndex,
    endIndex,
  };
}
