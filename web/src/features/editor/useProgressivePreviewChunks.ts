// useProgressivePreviewChunks.ts - progressively reveal large preview chunks across frames
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';

import type { MarkdownPreviewChunk } from '../../lib/markdownPreview';

const PROGRESSIVE_RENDER_THRESHOLD = 6;
const INITIAL_RENDERED_CHUNK_COUNT = 4;
const RENDER_BATCH_SIZE = 3;
const RENDER_BATCH_INTERVAL_MS = 32;

export interface UseProgressivePreviewChunksResult {
  renderedChunks: MarkdownPreviewChunk[];
  renderedChunkSignature: string;
  isProgressiveRendering: boolean;
  ensureHeadingChunkRendered: (headingId: string) => boolean;
}

export function useProgressivePreviewChunks(chunks: MarkdownPreviewChunk[]): UseProgressivePreviewChunksResult {
  const headingChunkIndexMap = useMemo(() => {
    const nextMap = new Map<string, number>();

    chunks.forEach((chunk, chunkIndex) => {
      chunk.headingIds.forEach((headingId) => {
        nextMap.set(headingId, chunkIndex);
      });
    });

    return nextMap;
  }, [chunks]);

  const shouldProgressivelyRender = chunks.length >= PROGRESSIVE_RENDER_THRESHOLD;
  const [visibleChunkCount, setVisibleChunkCount] = useState(chunks.length);

  useEffect(() => {
    const initialChunkCount = shouldProgressivelyRender
      ? Math.min(INITIAL_RENDERED_CHUNK_COUNT, chunks.length)
      : chunks.length;

    startTransition(() => {
      setVisibleChunkCount(initialChunkCount);
    });
  }, [chunks.length, shouldProgressivelyRender]);

  useEffect(() => {
    if (!shouldProgressivelyRender || visibleChunkCount >= chunks.length) {
      return;
    }

    const timerID = window.setTimeout(() => {
      startTransition(() => {
        setVisibleChunkCount((currentVisibleChunkCount) =>
          Math.min(currentVisibleChunkCount + RENDER_BATCH_SIZE, chunks.length),
        );
      });
    }, RENDER_BATCH_INTERVAL_MS);

    return () => {
      window.clearTimeout(timerID);
    };
  }, [chunks.length, shouldProgressivelyRender, visibleChunkCount]);

  const ensureHeadingChunkRendered = useCallback(
    (headingId: string) => {
      const targetChunkIndex = headingChunkIndexMap.get(headingId);
      if (targetChunkIndex === undefined) {
        return false;
      }

      const nextVisibleChunkCount = targetChunkIndex + 1;
      if (nextVisibleChunkCount <= visibleChunkCount) {
        return true;
      }

      startTransition(() => {
        setVisibleChunkCount(nextVisibleChunkCount);
      });

      return true;
    },
    [headingChunkIndexMap, visibleChunkCount],
  );

  const renderedChunks = useMemo(
    () => chunks.slice(0, visibleChunkCount),
    [chunks, visibleChunkCount],
  );

  const renderedChunkSignature = useMemo(
    () => renderedChunks.map((chunk) => chunk.id).join('|'),
    [renderedChunks],
  );

  return {
    renderedChunks,
    renderedChunkSignature,
    isProgressiveRendering: renderedChunks.length < chunks.length,
    ensureHeadingChunkRendered,
  };
}
