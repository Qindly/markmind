// Alert.tsx - 提供基于 shadcn/ui 风格封装的提示块组件
import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

const alertVariants = cva('w-full rounded-2xl border px-4 py-3 text-sm', {
  variants: {
    variant: {
      default: 'border-[var(--color-border-soft)] bg-[var(--color-page-bg)] text-[var(--color-text-primary)]',
      destructive:
        'border-[var(--color-toast-danger-border)] bg-[var(--color-toast-danger-bg)] text-[var(--color-toast-danger-text)]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

/**
 * Alert - 通用提示块容器。
 * 参数 props: 标准 div 属性与视觉变体。
 * 返回值：提示块 JSX 结构。
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className, variant, ...props }, ref) => {
  return <div className={cn(alertVariants({ variant }), className)} ref={ref} role="alert" {...props} />;
});

Alert.displayName = 'Alert';

/**
 * AlertTitle - 提示块标题。
 * 参数 props: 标准标题属性。
 * 返回值：标题 JSX 结构。
 */
export const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return <h5 className={cn('text-sm font-medium leading-none tracking-tight', className)} ref={ref} {...props} />;
  },
);

AlertTitle.displayName = 'AlertTitle';

/**
 * AlertDescription - 提示块正文。
 * 参数 props: 标准段落属性。
 * 返回值：正文 JSX 结构。
 */
export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return <p className={cn('text-sm leading-6', className)} ref={ref} {...props} />;
  },
);

AlertDescription.displayName = 'AlertDescription';
