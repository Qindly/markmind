// Eyebrow.tsx - 提供小型辅助标题文本组件
import type { HTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

export interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span';
}

/**
 * Eyebrow - 小型辅助标题文本组件。
 * 参数 props: 元素类型、标准属性与样式扩展。
 * 返回值：辅助标题 JSX 结构。
 */
export function Eyebrow({ as = 'p', className, ...props }: EyebrowProps) {
  const Component = as;

  return (
    <Component
      className={cn('text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]', className)}
      {...props}
    />
  );
}
