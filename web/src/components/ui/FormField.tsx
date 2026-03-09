// FormField.tsx - 提供表单字段的统一标签与提示布局
import type { PropsWithChildren, ReactNode } from 'react';

import { cn } from '../../lib/cn';
import { FieldMessage, type FieldMessageProps } from './FieldMessage';

export interface FormFieldProps extends PropsWithChildren {
  label: ReactNode;
  htmlFor?: string;
  message?: ReactNode;
  messageVariant?: FieldMessageProps['variant'];
  className?: string;
}

/**
 * FormField - 统一表单字段的标签、控件与说明排版。
 * 参数 props: 标签、字段提示、样式扩展与字段内容。
 * 返回值：字段布局 JSX 结构。
 */
export function FormField({
  label,
  htmlFor,
  message,
  messageVariant = 'default',
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-[var(--color-text-primary)]" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {message ? <FieldMessage variant={messageVariant}>{message}</FieldMessage> : null}
    </div>
  );
}
