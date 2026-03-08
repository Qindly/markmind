// Button.tsx - 提供统一风格的按钮组件
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: ButtonVariant;
}

/**
 * Button - 通用按钮组件
 * 参数 props: 标准按钮属性与加载态配置
 * 返回值：按钮 JSX 结构
 */
export function Button({ className, disabled, isLoading = false, variant = 'primary', children, ...props }: ButtonProps) {
  const variantClassName = {
    primary:
      'border-[var(--color-button-dark)] bg-[var(--color-button-dark)] text-[var(--color-button-dark-text)] hover:border-[var(--color-button-dark-hover)] hover:bg-[var(--color-button-dark-hover)] disabled:border-[var(--color-border-strong)] disabled:bg-[var(--color-border-strong)] disabled:text-[var(--color-button-dark-text)]',
    secondary:
      'border-[var(--color-border-soft)] bg-[var(--color-button-light)] text-[var(--color-button-light-text)] hover:border-[var(--color-border-soft)] hover:bg-[var(--color-button-light-hover)] disabled:border-[var(--color-border-soft)] disabled:bg-[var(--color-button-light)] disabled:text-[var(--color-text-muted)]',
    danger:
      'border-[var(--color-danger-border)] bg-[var(--color-danger-fill)] text-[var(--color-button-dark-text)] hover:border-[var(--color-danger-fill-hover)] hover:bg-[var(--color-danger-fill-hover)] disabled:border-[var(--color-danger-border)] disabled:bg-[var(--color-danger-border)] disabled:text-[var(--color-button-dark-text)]',
  } satisfies Record<ButtonVariant, string>;

  return (
    <button
      className={cn(
        'inline-flex h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed',
        variantClassName[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? '请稍候...' : children}
    </button>
  );
}
