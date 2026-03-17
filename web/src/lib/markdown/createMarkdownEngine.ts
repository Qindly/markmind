import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { createEchartsExtension } from './extensions/echartsExtension';
import { createHeadingExtension } from './extensions/headingExtension';
import { createHighlightExtension } from './extensions/highlightExtension';
import { createMathExtension } from './extensions/mathExtension';
import { createMermaidExtension } from './extensions/mermaidExtension';
import { markdownPreviewSchema } from './sanitizeSchema';
import type {
  HastNode,
  MarkdownExtension,
  MarkdownPreviewChunk,
  MarkdownPreviewResult,
  MarkdownRenderContext,
} from './types';

interface HastRoot extends HastNode {
  type: 'root';
  children: HastNode[];
}

const HEADING_TAG_PATTERN = /^h([1-6])$/;
const CHUNK_BLOCK_LIMIT = 12;
const CHUNK_MIN_BLOCKS = 4;
const CHUNK_TEXT_LIMIT = 6000;
const SMALL_DOCUMENT_CHARACTER_THRESHOLD = 8000;
const SMALL_DOCUMENT_BLOCK_THRESHOLD = 18;
const HEAVY_BLOCK_SIZE_BONUS_MAP: Record<string, number> = {
  blockquote: 240,
  details: 420,
  pre: 1400,
  table: 1100,
};

function createBaseExtensions(context: MarkdownRenderContext): MarkdownExtension[] {
  return [
    createMathExtension(),
    createHeadingExtension(context),
    createMermaidExtension(context),
    createEchartsExtension(context),
    createHighlightExtension(),
  ];
}

function createMarkdownProcessor(context: MarkdownRenderContext) {
  const extensions = createBaseExtensions(context);
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);

  for (const extension of extensions) {
    if (extension.remarkPlugins) {
      processor.use(extension.remarkPlugins);
    }
  }

  processor
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, markdownPreviewSchema);

  for (const extension of extensions) {
    if (extension.rehypePlugins) {
      processor.use(extension.rehypePlugins);
    }
  }

  return processor;
}

function visitHastTree(node: HastNode | undefined, visitor: (currentNode: HastNode) => void) {
  if (!node) {
    return;
  }

  visitor(node);
  node.children?.forEach((child) => {
    visitHastTree(child, visitor);
  });
}

function getPropertyValue(node: HastNode, propertyName: string): string {
  const propertyValue = node.properties?.[propertyName];
  return typeof propertyValue === 'string' ? propertyValue : '';
}

function extractNodeText(node: HastNode | undefined): string {
  if (!node) {
    return '';
  }

  if (node.type === 'text') {
    return node.value ?? '';
  }

  if (node.tagName === 'br') {
    return ' ';
  }

  return node.children?.map((child) => extractNodeText(child)).join('') ?? '';
}

function estimateNodeTextLength(node: HastNode): number {
  const textLength = extractNodeText(node).trim().length;
  const blockBonus = node.tagName ? (HEAVY_BLOCK_SIZE_BONUS_MAP[node.tagName] ?? 0) : 0;
  const specialBlockBonus = getPropertyValue(node, 'data-special-block') === 'true' ? 1800 : 0;

  return textLength + blockBonus + specialBlockBonus;
}

function isHeadingNode(node: HastNode): boolean {
  return Boolean(node.tagName?.match(HEADING_TAG_PATTERN));
}

function stringifyHastChildren(children: HastNode[]): string {
  const root: HastRoot = {
    type: 'root',
    children,
  };

  return unified().use(rehypeStringify).stringify(root as never) as string;
}

function createPreviewChunk(children: HastNode[], chunkIndex: number): MarkdownPreviewChunk {
  const headingIds: string[] = [];
  const specialBlockIds: string[] = [];
  let estimatedTextLength = 0;

  children.forEach((child) => {
    estimatedTextLength += estimateNodeTextLength(child);

    visitHastTree(child, (node) => {
      const headingId = getPropertyValue(node, 'id');
      if (headingId && isHeadingNode(node)) {
        headingIds.push(headingId);
      }

      const specialBlockId = getPropertyValue(node, 'data-block-id');
      if (specialBlockId && getPropertyValue(node, 'data-special-block') === 'true') {
        specialBlockIds.push(specialBlockId);
      }
    });
  });

  return {
    id: `preview-chunk-${chunkIndex}`,
    html: stringifyHastChildren(children),
    headingIds,
    specialBlockIds,
    blockCount: children.length,
    estimatedTextLength,
  };
}

function shouldEnableChunking(markdown: string, topLevelNodes: HastNode[]): boolean {
  return markdown.length >= SMALL_DOCUMENT_CHARACTER_THRESHOLD || topLevelNodes.length >= SMALL_DOCUMENT_BLOCK_THRESHOLD;
}

function createPreviewChunks(markdown: string, tree: HastRoot): MarkdownPreviewChunk[] {
  const topLevelNodes = tree.children ?? [];
  if (topLevelNodes.length === 0) {
    return [];
  }

  if (!shouldEnableChunking(markdown, topLevelNodes)) {
    return [createPreviewChunk(topLevelNodes, 1)];
  }

  const chunkNodeGroups: HastNode[][] = [];
  let currentChunkNodes: HastNode[] = [];
  let currentChunkTextLength = 0;

  topLevelNodes.forEach((node) => {
    const nextNodeTextLength = estimateNodeTextLength(node);
    const shouldSplitBeforeNode =
      currentChunkNodes.length > 0 &&
      (
        currentChunkNodes.length >= CHUNK_BLOCK_LIMIT ||
        (currentChunkNodes.length >= CHUNK_MIN_BLOCKS && currentChunkTextLength + nextNodeTextLength > CHUNK_TEXT_LIMIT) ||
        (currentChunkNodes.length >= CHUNK_MIN_BLOCKS && isHeadingNode(node))
      );

    if (shouldSplitBeforeNode) {
      chunkNodeGroups.push(currentChunkNodes);
      currentChunkNodes = [];
      currentChunkTextLength = 0;
    }

    currentChunkNodes.push(node);
    currentChunkTextLength += nextNodeTextLength;
  });

  if (currentChunkNodes.length > 0) {
    chunkNodeGroups.push(currentChunkNodes);
  }

  return chunkNodeGroups.map((children, index) => createPreviewChunk(children, index + 1));
}

export function renderMarkdownPreview(markdown: string): MarkdownPreviewResult {
  const context: MarkdownRenderContext = {
    headings: [],
    specialBlocks: [],
  };

  const processor = createMarkdownProcessor(context);
  const parsedMarkdown = processor.parse(markdown);
  const hastTree = processor.runSync(parsedMarkdown) as HastRoot;
  const chunks = createPreviewChunks(markdown, hastTree);
  const html = chunks.map((chunk) => chunk.html).join('');

  return {
    html,
    headings: context.headings,
    specialBlocks: context.specialBlocks,
    chunks,
    isChunked: chunks.length > 1,
  };
}

export function renderMarkdownToHtml(markdown: string): string {
  return renderMarkdownPreview(markdown).html;
}
