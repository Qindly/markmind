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

export function createEchartsExtension(context: MarkdownRenderContext): MarkdownExtension {
  return {
    name: 'echarts',
    rehypePlugins: [
      function echartsPlugin() {
        let echartsIndex = 0;

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
            const isEcharts = classNames.some((item) => item === 'language-echarts');

            if (!isEcharts) {
              return;
            }

            const code = extractText(codeNode);
            const id = `echarts-block-${++echartsIndex}`;

            context.specialBlocks.push({
              id,
              type: 'echarts',
              language: 'echarts',
              code,
            });

            node.tagName = 'div';
            node.properties = {
              ...(node.properties ?? {}),
              id,
              className: ['markmind-special-block', 'markmind-special-block-echarts'],
              'data-special-block': 'true',
              'data-block-type': 'echarts',
              'data-block-id': id,
            };
            node.children = [];
          });
        };
      },
    ],
  };
}
