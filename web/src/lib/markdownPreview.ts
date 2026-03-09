// markdownPreview.ts - 提供基于 unified 的 Markdown 预览渲染能力
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

// 这里保留代码语言类名、任务列表类名和有序列表起始值，
// 这样语法高亮、数学公式与列表样式都能拿到需要的结构信息。
const markdownPreviewSchema: Parameters<typeof rehypeSanitize>[0] = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className', /^language-./, 'math-inline', 'math-display'] as const,
    ],
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

const markdownPreviewProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeSanitize, markdownPreviewSchema)
  .use(rehypeKatex)
  .use(rehypeHighlight)
  .use(rehypeStringify);

// renderMarkdownToHtml - 将 Markdown 字符串转换为可安全展示的 HTML。
// 参数 markdown: 原始 Markdown 内容。
// 返回值：经过 GFM、数学公式、代码高亮扩展和清洗后的 HTML 字符串。
export function renderMarkdownToHtml(markdown: string): string {
  return markdownPreviewProcessor.processSync(markdown).toString();
}
