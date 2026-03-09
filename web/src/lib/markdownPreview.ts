// markdownPreview.ts - 提供基于 unified 的 Markdown 预览渲染与标题提取能力
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const HEADING_TAG_PATTERN = /^h([1-6])$/;

export interface MarkdownHeading {
  id: string;
  text: string;
  depth: number;
}

export interface MarkdownPreviewResult {
  html: string;
  headings: MarkdownHeading[];
}

const markdownPreviewSchema: Parameters<typeof rehypeSanitize>[0] = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className', /^language-./, 'math-inline', 'math-display'] as const,
    ],
    h1: [...(defaultSchema.attributes?.h1 ?? []), 'id'],
    h2: [...(defaultSchema.attributes?.h2 ?? []), 'id'],
    h3: [...(defaultSchema.attributes?.h3 ?? []), 'id'],
    h4: [...(defaultSchema.attributes?.h4 ?? []), 'id'],
    h5: [...(defaultSchema.attributes?.h5 ?? []), 'id'],
    h6: [...(defaultSchema.attributes?.h6 ?? []), 'id'],
    ol: [...(defaultSchema.attributes?.ol ?? []), 'start'],
    th: [...(defaultSchema.attributes?.th ?? []), 'align'],
    td: [...(defaultSchema.attributes?.td ?? []), 'align'],
    ul: [
      ...(defaultSchema.attributes?.ul ?? []),
      ['className', 'contains-task-list'] as const,
    ],
    li: [
      ...(defaultSchema.attributes?.li ?? []),
      ['className', 'task-list-item'] as const,
    ],
    input: [
      ...(defaultSchema.attributes?.input ?? []),
      ['type', 'checkbox'] as const,
      ['checked', true] as const,
      ['disabled', true] as const,
    ],
  },
};

// normalizeHeadingText - 将标题文本压缩为空格友好的可读文本。
// 参数 text: 原始标题文本。
// 返回值：去掉多余空白后的标题字符串。
function normalizeHeadingText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// extractNodeText - 递归提取节点及其子节点中的可读文本。
// 参数 node: 当前 HAST 节点。
// 返回值：适合用于 TOC 展示的纯文本内容。
function extractNodeText(node: HastNode | undefined): string {
  if (!node) {
    return '';
  }

  if (node.type === 'text') {
    return node.value ?? '';
  }

  if (!node.children?.length) {
    return node.tagName === 'br' ? ' ' : '';
  }

  return node.children.map((child) => extractNodeText(child)).join('');
}

// visitHastTree - 深度优先遍历 HAST 树。
// 参数 node: 当前节点。
// 参数 visitor: 节点访问回调。
function visitHastTree(node: HastNode | undefined, visitor: (currentNode: HastNode) => void) {
  if (!node) {
    return;
  }

  visitor(node);
  node.children?.forEach((child) => {
    visitHastTree(child, visitor);
  });
}

// createHeadingSlugger - 创建带去重能力的标题 slug 生成器。
// 返回值：根据标题文本生成稳定锚点 ID 的函数。
function createHeadingSlugger() {
  const slugCountMap = new Map<string, number>();

  return (text: string) => {
    const baseSlug =
      text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{N}-]+/gu, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'section';

    const count = slugCountMap.get(baseSlug) ?? 0;
    slugCountMap.set(baseSlug, count + 1);

    return count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
  };
}

// collectHeadingsPlugin - 为标题节点写入锚点 ID，并同时收集 TOC 数据。
// 参数 headings: 当前 Markdown 对应的标题列表。
function collectHeadingsPlugin(headings: MarkdownHeading[]) {
  return () => {
    const createSlug = createHeadingSlugger();

    return (tree: HastNode) => {
      visitHastTree(tree, (node) => {
        const headingMatch = node.tagName?.match(HEADING_TAG_PATTERN);
        if (!headingMatch) {
          return;
        }

        const text = normalizeHeadingText(extractNodeText(node));
        if (!text) {
          return;
        }

        const id = createSlug(text);
        node.properties = {
          ...(node.properties ?? {}),
          id,
        };

        headings.push({
          id,
          text,
          depth: Number(headingMatch[1]),
        });
      });
    };
  };
}

// renderMarkdownPreview - 将 Markdown 字符串转换为 HTML 与标题目录数据。
// 参数 markdown: 原始 Markdown 内容。
// 返回值：包含安全 HTML 与 TOC 标题数组的预览结果。
export function renderMarkdownPreview(markdown: string): MarkdownPreviewResult {
  const headings: MarkdownHeading[] = [];

  const html = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeSanitize, markdownPreviewSchema)
    .use(collectHeadingsPlugin(headings))
    .use(rehypeKatex)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();

  return {
    html,
    headings,
  };
}

// renderMarkdownToHtml - 兼容旧调用方式，仅返回 Markdown 对应的 HTML。
// 参数 markdown: 原始 Markdown 内容。
// 返回值：处理后的安全 HTML 字符串。
export function renderMarkdownToHtml(markdown: string): string {
  return renderMarkdownPreview(markdown).html;
}
