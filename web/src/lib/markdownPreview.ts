// markdownPreview.ts - 对外暴露统一的 Markdown 预览引擎与类型
export {
  renderMarkdownPreview,
  renderMarkdownToHtml,
} from './markdown/createMarkdownEngine';

export type {
  MarkdownHeading,
  MarkdownPreviewChunk,
  MarkdownPreviewResult,
  MarkdownSpecialBlock,
} from './markdown/types';
