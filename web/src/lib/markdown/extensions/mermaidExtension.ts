import type { HastNode, MarkdownExtension, MarkdownRenderContext } from '../types';

function visitHastTree(node: HastNode | undefined, visitor: (currentNode: HastNode) => void) {
  if (!node) {
    return;
  }

  visitor(node);
  node.children?.forEach((child) => visitHastTree(child, visitor));
}

function extractText(node: HastNode | undefined): string {
  if (!node) {
    return '';
  }

  if (node.type === 'text') {
    return node.value ?? '';
  }

  return node.children?.map((child) => extractText(child)).join('') ?? '';
}

export function createMermaidExtension(context: MarkdownRenderContext): MarkdownExtension {
  return {
    name: 'mermaid',
    rehypePlugins: [
      function mermaidPlugin() {
        let mermaidIndex = 0;

        return (tree: HastNode) => {
          visitHastTree(tree, (node) => {
            if (node.tagName !== 'pre' || !node.children?.length) {
              return;
            }

            const codeNode = node.children.find((child) => child.tagName === 'code');
            if (!codeNode) {
              return;
            }

            const className = codeNode.properties?.className;
            const classNames = Array.isArray(className) ? className : [className];
            const isMermaid = classNames.some((item) => item === 'language-mermaid');

            if (!isMermaid) {
              return;
            }

            const code = extractText(codeNode);
            const id = `mermaid-block-${++mermaidIndex}`;

            context.specialBlocks.push({
              id,
              type: 'mermaid',
              language: 'mermaid',
              code,
            });

            node.tagName = 'div';
            node.properties = {
              ...(node.properties ?? {}),
              id,
              className: ['markmind-special-block', 'markmind-special-block-mermaid'],
              'data-special-block': 'true',
              'data-block-type': 'mermaid',
              'data-block-id': id,
            };
            node.children = [];
          });
        };
      },
    ],
  };
}
