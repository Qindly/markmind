// SectionHeader.tsx - 提供区块头部标题与操作区组件
import type { ElementType, ReactNode } from 'react';

import { cn } from '../../lib/cn';
import { InfoBlock } from './InfoBlock';

export interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  titleAs?: ElementType;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  eyebrowClassName?: string;
}

/**
 * SectionHeader - 区块头部标题、描述和操作区的统一展示组件。
 * 参数 props: 标题信息、右侧操作区与样式扩展。
 * 返回值：区块头部 JSX 结构。
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  titleAs = 'h2',
  className,
  contentClassName,
  titleClassName,
  descriptionClassName,
  eyebrowClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <InfoBlock
        className={cn('space-y-1', contentClassName)}
        compact
        description={description}
        descriptionClassName={cn('text-sm leading-6 text-[var(--color-text-secondary)]', descriptionClassName)}
        eyebrow={eyebrow}
        eyebrowClassName={eyebrowClassName}
        title={title}
        titleAs={titleAs}
        titleClassName={cn('text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]', titleClassName)}
      />
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
