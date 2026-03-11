// Button.tsx - 提供基于 shadcn/ui 风格封装的按钮组件
import * as React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(20,20,19,0.05)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-page-bg)] disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'border-[var(--color-button-dark)] bg-[var(--color-button-dark)] text-[var(--color-button-dark-text)] hover:border-[var(--color-button-dark-hover)] hover:bg-[var(--color-button-dark-hover)] disabled:border-[var(--color-border-strong)] disabled:bg-[var(--color-border-strong)] disabled:text-[var(--color-button-dark-text)]',
        secondary:
          'border-[var(--color-border-soft)] bg-[var(--color-button-light)] text-[var(--color-button-light-text)] hover:border-[var(--color-border-soft)] hover:bg-[var(--color-button-light-hover)] hover:text-[var(--color-text-primary)] disabled:border-[var(--color-border-soft)] disabled:bg-[var(--color-button-light)] disabled:text-[var(--color-text-muted)]',
        danger:
          'border-[var(--color-danger-border)] bg-[var(--color-danger-fill)] text-[var(--color-button-dark-text)] hover:border-[var(--color-danger-fill-hover)] hover:bg-[var(--color-danger-fill-hover)] disabled:border-[var(--color-danger-border)] disabled:bg-[var(--color-danger-border)] disabled:text-[var(--color-button-dark-text)]',
      },
      size: {
        default: 'h-11 px-4',
        sm: 'h-10 px-3 text-xs',
        lg: 'h-12 px-5',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

/**
 * Button - 通用按钮组件。
 * 参数 props: 标准按钮属性、视觉变体、尺寸和加载态。
 * 返回值：按钮 JSX 结构。
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, disabled, children, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    const isDisabled = disabled || isLoading;

    return (
      <Component
        aria-busy={isLoading || undefined}
        aria-disabled={asChild ? isDisabled : undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : isDisabled}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>请稍候...</span>
          </>
        ) : (
          children
        )}
      </Component>
    );
  },
);

Button.displayName = 'Button';