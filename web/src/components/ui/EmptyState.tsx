// EmptyState.tsx - 提供统一的空状态与轻提示展示组件
import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';
import { Card, CardContent } from './Card';
import { InfoBlock } from './InfoBlock';

export interface EmptyStateProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * EmptyState - 统一空状态与轻提示内容块。
 * 参数 props: 标题、描述、可选操作区与样式扩展。
 * 返回值：空状态 JSX 结构。
 */
export function EmptyState({ eyebrow, title, description, action, className, contentClassName }: EmptyStateProps) {
  return (
    <Card className={cn('rounded-2xl border-dashed shadow-none', className)}>
      <CardContent className={cn('space-y-4 p-5 pt-5', contentClassName)}>
        <InfoBlock compact description={description} eyebrow={eyebrow} title={title} />
        {action ? <div>{action}</div> : null}
      </CardContent>
    </Card>
  );
}
