import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

import type { MarkdownExtension } from '../types';

export function createMathExtension(): MarkdownExtension {
  return {
    name: 'math',
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  };
}