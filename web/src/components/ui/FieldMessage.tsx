// FieldMessage.tsx - 提供表单字段提示与错误文案组件
import type { HTMLAttributes } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

const fieldMessageVariants = cva('text-xs leading-6', {
  variants: {
    variant: {
      default: 'text-[var(--color-text-secondary)]',
      destructive: 'text-[var(--color-danger-text)]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface FieldMessageProps extends HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof fieldMessageVariants> {}

/**
 * FieldMessage - 字段下方的提示或错误文案。
 * 参数 props: 标准段落属性与视觉变体。
 * 返回值：字段提示 JSX 结构。
 */
export function FieldMessage({ className, variant, ...props }: FieldMessageProps) {
  return <p className={cn(fieldMessageVariants({ variant }), className)} {...props} />;
}
