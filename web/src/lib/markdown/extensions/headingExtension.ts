import type { HastNode, MarkdownExtension, MarkdownRenderContext } from '../types';

const HEADING_TAG_PATTERN = /^h([1-6])$/;

function normalizeHeadingText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

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

function visitHastTree(node: HastNode | undefined, visitor: (currentNode: HastNode) => void) {
  if (!node) {
    return;
  }

  visitor(node);
  node.children?.forEach((child) => {
    visitHastTree(child, visitor);
  });
}

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

export function createHeadingExtension(context: MarkdownRenderContext): MarkdownExtension {
  return {
    name: 'heading',
    rehypePlugins: [
      function headingPlugin() {
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

            context.headings.push({
              id,
              text,
              depth: Number(headingMatch[1]),
            });
          });
        };
      },
    ],
  };
}