// markdownPreview.ts - 对外暴露 Markdown 预览相关类型（渲染逻辑已移入 Web Worker）
export type {
  MarkdownHeading,
  MarkdownPreviewChunk,
  MarkdownPreviewResult,
  MarkdownSpecialBlock,
} from './markdown/types';
