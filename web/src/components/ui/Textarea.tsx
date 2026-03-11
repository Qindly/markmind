// Textarea.tsx - 提供基于 shadcn/ui 风格封装的多行输入框组件
import * as React from 'react';

import { cn } from '../../lib/cn';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Textarea - 通用多行输入框组件。
 * 参数 props: 标准多行输入框属性。
 * 返回值：多行输入框 JSX 结构。
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[220px] w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-3 text-sm leading-7 text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[rgba(20,20,19,0.05)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
