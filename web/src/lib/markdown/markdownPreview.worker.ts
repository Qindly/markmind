// markdownPreview.worker.ts - 在 Worker 线程执行 Markdown 渲染，避免阻塞主线程
// ⚠️ workerDomShim 必须在所有其他导入之前加载，
// 因为 KaTeX (rehype-katex) 在模块初始化时会访问 document，
// 而 Web Worker 环境中没有 document，需要提前注入最小垫片。
import './workerDomShim';
import { renderMarkdownPreview } from './createMarkdownEngine';

// P1 优化：使用 Transferable 零拷贝传输。
// 主线程用 ArrayBuffer 发送 Markdown 原文，Worker 用 ArrayBuffer 返回所有 chunk HTML，
// 避免结构化克隆产生的额外内存拷贝。

interface WorkerRequest {
  id: number;
  markdownBuffer: ArrayBuffer;
}

interface WorkerChunkMeta {
  id: string;
  headingIds: string[];
  specialBlockIds: string[];
  blockCount: number;
  estimatedTextLength: number;
}

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, markdownBuffer } = event.data;

  try {
    const markdown = textDecoder.decode(new Uint8Array(markdownBuffer));
    const result = renderMarkdownPreview(markdown);

    // 将所有 chunk HTML 编码到一个连续 ArrayBuffer 中
    const encodedHtmlParts = result.chunks.map((chunk) => textEncoder.encode(chunk.html));
    const totalByteLength = encodedHtmlParts.reduce((sum, part) => sum + part.byteLength, 0);
    const htmlBuffer = new ArrayBuffer(totalByteLength);
    const htmlView = new Uint8Array(htmlBuffer);
    const htmlOffsets: number[] = [];
    let byteOffset = 0;

    for (const part of encodedHtmlParts) {
      htmlOffsets.push(byteOffset);
      htmlView.set(part, byteOffset);
      byteOffset += part.byteLength;
    }
    // 末尾哨兵值，用于计算最后一个 chunk 的长度
    htmlOffsets.push(byteOffset);

    const chunkMetas: WorkerChunkMeta[] = result.chunks.map((chunk) => ({
      id: chunk.id,
      headingIds: chunk.headingIds,
      specialBlockIds: chunk.specialBlockIds,
      blockCount: chunk.blockCount,
      estimatedTextLength: chunk.estimatedTextLength,
    }));

    // 使用 Transferable 发送 htmlBuffer，零拷贝转移所有权
    self.postMessage(
      {
        id,
        headings: result.headings,
        specialBlocks: result.specialBlocks,
        isChunked: result.isChunked,
        chunkMetas,
        htmlBuffer,
        htmlOffsets,
        error: null,
      },
      { transfer: [htmlBuffer] },
    );
  } catch (err) {
    self.postMessage({
      id,
      headings: [],
      specialBlocks: [],
      isChunked: false,
      chunkMetas: [],
      htmlBuffer: new ArrayBuffer(0),
      htmlOffsets: [],
      error: String(err),
    });
  }
};
