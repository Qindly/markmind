// InfoBlock.tsx - 提供统一的信息摘要与说明文案组件
import type { ElementType, ReactNode } from 'react';

import { cn } from '../../lib/cn';
import { Eyebrow } from './Eyebrow';

export interface InfoBlockProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  titleAs?: ElementType;
  align?: 'left' | 'center';
  compact?: boolean;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

/**
 * InfoBlock - 统一展示辅助标题、标题和说明文案的展示块。
 * 参数 props: 文案内容、对齐方式、紧凑模式与样式扩展。
 * 返回值：信息摘要 JSX 结构。
 */
export function InfoBlock({
  eyebrow,
  title,
  description,
  titleAs: Title = 'p',
  align = 'left',
  compact = false,
  className,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
}: InfoBlockProps) {
  return (
    <div className={cn(compact ? 'space-y-1' : 'space-y-3', align === 'center' ? 'text-center' : 'text-left', className)}>
      {eyebrow ? <Eyebrow className={eyebrowClassName}>{eyebrow}</Eyebrow> : null}
      {title ? (
        <Title className={cn('text-sm font-medium text-[var(--color-text-primary)]', titleClassName)}>
          {title}
        </Title>
      ) : null}
      {description ? <p className={cn('text-sm leading-6 text-[var(--color-text-secondary)]', descriptionClassName)}>{description}</p> : null}
    </div>
  );
}
