import type { PluggableList } from 'unified';

export interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

export interface MarkdownHeading {
  id: string;
  text: string;
  depth: number;
}

export interface MarkdownPreviewChunk {
  id: string;
  html: string;
  headingIds: string[];
  specialBlockIds: string[];
  blockCount: number;
  estimatedTextLength: number;
}

export interface MarkdownSpecialBlock {
  id: string;
  type: 'mermaid' | 'echarts';
  language: string;
  code: string;
}

export interface MarkdownPreviewResult {
  html: string;
  headings: MarkdownHeading[];
  specialBlocks: MarkdownSpecialBlock[];
  chunks: MarkdownPreviewChunk[];
  isChunked: boolean;
}

export interface MarkdownRenderContext {
  headings: MarkdownHeading[];
  specialBlocks: MarkdownSpecialBlock[];
}

export interface MarkdownExtension {
  name: string;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
}
