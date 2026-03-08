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
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-200',
        className,
      )}
      {...props}
    />
  );
}
