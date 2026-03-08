// Input.tsx - 提供统一风格的输入框组件
import type { InputHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

/**
 * Input - 通用输入框组件
 * 参数 props: 标准输入框属性
 * 返回值：输入框 JSX 结构
 */
export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-border-strong)] focus:ring-2 focus:ring-[rgba(20,20,19,0.05)]',
        className,
      )}
      {...props}
    />
  );
}
