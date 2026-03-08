// Button.tsx - 提供统一风格的按钮组件
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

/**
 * Button - 通用按钮组件
 * 参数 props: 标准按钮属性与加载态配置
 * 返回值：按钮 JSX 结构
 */
export function Button({ className, disabled, isLoading = false, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-900 bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400',
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? '请稍候...' : children}
    </button>
  );
}
