// markdownPreviewWorkerClient.ts - 主线程侧的 Worker 通信客户端
// P1 优化：使用 Transferable 零拷贝传输，避免结构化克隆产生额外内存拷贝。
import type {
  MarkdownHeading,
  MarkdownPreviewChunk,
  MarkdownPreviewResult,
  MarkdownSpecialBlock,
} from './types';

interface PendingRequest {
  resolve: (result: MarkdownPreviewResult) => void;
  reject: (error: Error) => void;
}

interface WorkerChunkMeta {
  id: string;
  headingIds: string[];
  specialBlockIds: string[];
  blockCount: number;
  estimatedTextLength: number;
}

interface WorkerResponse {
  id: number;
  headings: MarkdownHeading[];
  specialBlocks: MarkdownSpecialBlock[];
  isChunked: boolean;
  chunkMetas: WorkerChunkMeta[];
  htmlBuffer: ArrayBuffer;
  htmlOffsets: number[];
  error: string | null;
}

let worker: Worker | null = null;
let nextRequestId = 0;
const pendingRequests = new Map<number, PendingRequest>();

// LRU 缓存：相同内容不重复渲染（如 Undo/Redo 场景）
const CACHE_MAX_SIZE = 8;
const CACHE_MAX_CONTENT_LENGTH = 80_000;
const resultCache = new Map<string, MarkdownPreviewResult>();

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getCachedResult(markdown: string): MarkdownPreviewResult | undefined {
  if (markdown.length > CACHE_MAX_CONTENT_LENGTH) {
    return undefined;
  }
  const cached = resultCache.get(markdown);
  if (cached) {
    // 移到末尾保持 LRU 顺序
    resultCache.delete(markdown);
    resultCache.set(markdown, cached);
  }
  return cached;
}

function setCachedResult(markdown: string, result: MarkdownPreviewResult): void {
  if (markdown.length > CACHE_MAX_CONTENT_LENGTH) {
    return;
  }
  if (resultCache.size >= CACHE_MAX_SIZE) {
    // 删除最旧的条目
    const oldestKey = resultCache.keys().next().value;
    if (oldestKey !== undefined) {
      resultCache.delete(oldestKey);
    }
  }
  resultCache.set(markdown, result);
}

/** 从 Worker 返回的 ArrayBuffer + offsets 中还原每个 chunk 的 HTML 字符串 */
function decodeChunksFromBuffer(
  chunkMetas: WorkerChunkMeta[],
  htmlBuffer: ArrayBuffer,
  htmlOffsets: number[],
): MarkdownPreviewChunk[] {
  const bufferView = new Uint8Array(htmlBuffer);

  return chunkMetas.map((meta, index) => {
    const start = htmlOffsets[index];
    const end = htmlOffsets[index + 1];
    const htmlBytes = bufferView.slice(start, end);
    const html = textDecoder.decode(htmlBytes);

    return {
      id: meta.id,
      html,
      headingIds: meta.headingIds,
      specialBlockIds: meta.specialBlockIds,
      blockCount: meta.blockCount,
      estimatedTextLength: meta.estimatedTextLength,
    };
  });
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('./markdownPreview.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { id, error } = event.data;
      const pending = pendingRequests.get(id);

      if (!pending) {
        return;
      }

      pendingRequests.delete(id);

      if (error) {
        pending.reject(new Error(error));
        return;
      }

      const { headings, specialBlocks, isChunked, chunkMetas, htmlBuffer, htmlOffsets } = event.data;
      const chunks = decodeChunksFromBuffer(chunkMetas, htmlBuffer, htmlOffsets);

      pending.resolve({
        html: '',
        headings,
        specialBlocks,
        chunks,
        isChunked,
      });
    };
  }

  return worker;
}

export interface WorkerRenderHandle {
  promise: Promise<MarkdownPreviewResult>;
  id: number;
}

export function renderMarkdownInWorker(markdown: string): WorkerRenderHandle {
  const id = ++nextRequestId;

  // 命中缓存时直接返回，不发给 Worker
  const cached = getCachedResult(markdown);
  if (cached) {
    return { promise: Promise.resolve(cached), id };
  }

  const promise = new Promise<MarkdownPreviewResult>((resolve, reject) => {
    pendingRequests.set(id, {
      resolve: (result) => {
        setCachedResult(markdown, result);
        resolve(result);
      },
      reject,
    });

    // P1 优化：将 Markdown 字符串编码为 ArrayBuffer，
    // 通过 Transferable 零拷贝发送给 Worker
    const markdownBuffer = textEncoder.encode(markdown).buffer;
    getWorker().postMessage({ id, markdownBuffer }, [markdownBuffer]);
  });

  return { promise, id };
}

export function cancelWorkerRequest(id: number): void {
  pendingRequests.delete(id);
}
