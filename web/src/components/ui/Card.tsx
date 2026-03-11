// Card.tsx - 提供基于 shadcn/ui 风格封装的卡片组件
import * as React from 'react';
import type { PropsWithChildren } from 'react';

import { cn } from '../../lib/cn';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;
export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Card - 卡片容器组件。
 * 参数 props: 标准 div 属性。
 * 返回值：卡片 JSX 结构。
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn('rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-surface-level-1)] shadow-soft', className)}
      ref={ref}
      {...props}
    />
  );
});

Card.displayName = 'Card';

/**
 * CardHeader - 卡片头部容器。
 * 参数 props: 标准 div 属性。
 * 返回值：头部 JSX 结构。
 */
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => {
  return <div className={cn('flex flex-col space-y-2 p-8 pb-0', className)} ref={ref} {...props} />;
});

CardHeader.displayName = 'CardHeader';

/**
 * CardTitle - 卡片标题。
 * 参数 props: 标准标题属性。
 * 返回值：标题 JSX 结构。
 */
export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, ...props }, ref) => {
  return <h1 className={cn('text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]', className)} ref={ref} {...props} />;
});

CardTitle.displayName = 'CardTitle';

/**
 * CardDescription - 卡片描述。
 * 参数 props: 标准段落属性。
 * 返回值：描述 JSX 结构。
 */
export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(({ className, ...props }, ref) => {
  return <p className={cn('text-sm leading-6 text-[var(--color-text-secondary)]', className)} ref={ref} {...props} />;
});

CardDescription.displayName = 'CardDescription';

/**
 * CardContent - 卡片正文容器。
 * 参数 props: 标准 div 属性。
 * 返回值：正文 JSX 结构。
 */
export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => {
  return <div className={cn('p-8 pt-8', className)} ref={ref} {...props} />;
});

CardContent.displayName = 'CardContent';

/**
 * CardSection - 轻量内容分组组件。
 * 参数 children: 需要包裹的内容。
 * 返回值：内容片段 JSX 结构。
 */
export function CardSection({ children }: PropsWithChildren) {
  return <div className="space-y-6">{children}</div>;
}