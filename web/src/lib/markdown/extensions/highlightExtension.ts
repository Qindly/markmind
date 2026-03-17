import rehypeHighlight from 'rehype-highlight';

import type { MarkdownExtension } from '../types';

export function createHighlightExtension(): MarkdownExtension {
  return {
    name: 'highlight',
    rehypePlugins: [rehypeHighlight],
  };
}