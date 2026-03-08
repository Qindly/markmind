// Input.tsx - 提供基于 shadcn/ui 风格封装的输入框组件
import * as React from 'react';

import { cn } from '../../lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Input - 通用输入框组件。
 * 参数 props: 标准输入框属性。
 * 返回值：输入框 JSX 结构。
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[rgba(20,20,19,0.05)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]',
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  );
});

Input.displayName = 'Input';